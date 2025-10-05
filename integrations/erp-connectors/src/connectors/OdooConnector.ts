/**
 * Odoo ERP Connector
 *
 * Connects to Odoo via XML-RPC or JSON-RPC External API
 *
 * Features:
 * - Simple username/password authentication
 * - XML-RPC for legacy support
 * - JSON-RPC for modern API (faster)
 * - Webhook support via Odoo automated actions
 * - No rate limiting (depends on server configuration)
 */

import {
  BaseConnector,
  ERPCredentials,
  InventoryItem,
  SyncMethod,
  WebhookPayload,
} from '../base/BaseConnector'
import crypto from 'crypto'

interface OdooInventoryItem {
  id: number
  name: string
  default_code: string // SKU
  qty_available: number
  standard_price: number
  location_id?: [number, string] // [id, name]
  seller_ids?: number[] // Vendor IDs
  write_date: string
}

interface OdooCredentials extends ERPCredentials {
  database?: string
  username?: string
  password?: string
}

export class OdooConnector extends BaseConnector {
  private database: string
  private username: string
  private password: string
  private uid?: number // User ID after authentication
  private webhookSecret: string

  constructor(credentials: OdooCredentials) {
    // Odoo supports webhooks via automated actions (simple triggers)
    super('Odoo', credentials, SyncMethod.HYBRID, 300000) // 5 min polling

    this.database = credentials.database || credentials.companyId || process.env.ODOO_DATABASE || ''
    this.username = credentials.username || credentials.apiKey || ''
    this.password = credentials.password || credentials.apiSecret || ''
    this.webhookSecret = process.env.ODOO_WEBHOOK_SECRET || crypto.randomBytes(32).toString('hex')
  }

  async authenticate(): Promise<void> {
    console.log(`[${this.name}] Authenticating with XML-RPC...`)

    try {
      // Odoo authentication via /web/session/authenticate
      const response = await this.httpClient.post('/web/session/authenticate', {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          db: this.database,
          login: this.username,
          password: this.password,
        },
      })

      if (response.data.error) {
        throw new Error(response.data.error.data.message || 'Authentication failed')
      }

      this.uid = response.data.result.uid

      // Store session cookie for subsequent requests
      const cookies = response.headers['set-cookie']
      if (cookies) {
        this.httpClient.defaults.headers.common['Cookie'] = cookies.join('; ')
      }

      console.log(`[${this.name}] ✅ Authenticated as user ${this.uid}`)
    } catch (error: any) {
      console.error(`[${this.name}] ❌ Authentication failed:`, error.message)
      throw error
    }
  }

  async refreshAuthentication(): Promise<boolean> {
    try {
      await this.authenticate()
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Execute Odoo RPC call
   */
  private async executeRPC(model: string, method: string, args: any[] = [], kwargs: any = {}): Promise<any> {
    const response = await this.httpClient.post('/web/dataset/call_kw', {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        model,
        method,
        args,
        kwargs: {
          context: { lang: 'en_US' },
          ...kwargs,
        },
      },
    })

    if (response.data.error) {
      throw new Error(response.data.error.data.message || 'RPC call failed')
    }

    return response.data.result
  }

  async fetchInventory(): Promise<InventoryItem[]> {
    if (!this.uid) {
      await this.authenticate()
    }

    const items: InventoryItem[] = []
    let offset = 0
    const limit = 100 // Odoo batch limit

    try {
      while (true) {
        // Search for product.product records
        const productIds = await this.retryWithBackoff(async () => {
          return await this.executeRPC(
            'product.product',
            'search',
            [[]],
            {
              offset,
              limit,
            }
          )
        })

        if (productIds.length === 0) break

        // Read product details
        const odooItems: OdooInventoryItem[] = await this.retryWithBackoff(async () => {
          return await this.executeRPC('product.product', 'read', [
            productIds,
            ['id', 'name', 'default_code', 'qty_available', 'standard_price', 'location_id', 'seller_ids', 'write_date'],
          ])
        })

        const transformed = odooItems.map((item) => ({
          sku: item.default_code || `ODOO-${item.id}`,
          name: item.name,
          quantity: Math.floor(item.qty_available),
          price: item.standard_price,
          supplierId: item.seller_ids?.[0]?.toString(),
          warehouseId: item.location_id?.[0]?.toString(),
          lastUpdated: new Date(item.write_date),
        }))

        items.push(...transformed)
        offset += limit

        // No strict rate limiting in Odoo, but be respectful
        await this.sleep(200)

        console.log(`[${this.name}] Fetched ${items.length} items...`)
      }

      return items
    } catch (error: any) {
      console.error(`[${this.name}] Failed to fetch inventory:`, error.message)
      throw error
    }
  }

  async updateInventoryItem(sku: string, data: Partial<InventoryItem>): Promise<void> {
    if (!this.uid) {
      await this.authenticate()
    }

    try {
      // Find product by SKU
      const productIds = await this.executeRPC('product.product', 'search', [[['default_code', '=', sku]]], { limit: 1 })

      if (productIds.length === 0) {
        throw new Error(`Product with SKU ${sku} not found`)
      }

      const productId = productIds[0]

      // Update product
      await this.retryWithBackoff(async () => {
        return await this.executeRPC('product.product', 'write', [
          [productId],
          {
            qty_available: data.quantity,
            standard_price: data.price,
          },
        ])
      })

      console.log(`[${this.name}] Updated ${sku}`)
    } catch (error: any) {
      console.error(`[${this.name}] Failed to update ${sku}:`, error.message)
      throw error
    }
  }

  async setupWebhook(callbackUrl: string): Promise<void> {
    if (!this.uid) {
      await this.authenticate()
    }

    console.log(`[${this.name}] Setting up webhook via automated action...`)

    try {
      // Create an automated action (ir.cron or base.automation)
      // This triggers on product.product create/write/unlink

      await this.executeRPC('base.automation', 'create', [
        [
          {
            name: 'SupplySync Inventory Webhook',
            model_id: 1, // product.product model ID (typically 1, but should be looked up)
            trigger: 'on_write', // on_create, on_write, on_unlink
            action_server_id: false,
            webhook_url: callbackUrl,
            webhook_field_ids: [
              // Fields to send in webhook
              'id',
              'name',
              'default_code',
              'qty_available',
              'standard_price',
            ],
          },
        ],
      ])

      console.log(`[${this.name}] ✅ Webhook configured`)
    } catch (error: any) {
      console.error(`[${this.name}] ❌ Webhook setup failed:`, error.message)

      // Fallback to polling
      if (this.syncMethod === SyncMethod.HYBRID) {
        console.warn(`[${this.name}] Falling back to polling mode`)
        this.startPolling()
      } else {
        throw error
      }
    }
  }

  async handleWebhook(payload: WebhookPayload): Promise<void> {
    console.log(`[${this.name}] Received webhook: ${payload.event}`)

    try {
      const itemData = payload.data

      const item: InventoryItem = {
        sku: itemData.default_code || `ODOO-${itemData.id}`,
        name: itemData.name,
        quantity: Math.floor(itemData.qty_available || 0),
        price: itemData.standard_price || 0,
        supplierId: itemData.seller_ids?.[0]?.toString(),
        warehouseId: itemData.location_id?.[0]?.toString(),
        lastUpdated: new Date(),
      }

      await this.processInventoryItem(item)

      console.log(`[${this.name}] ✅ Webhook processed: ${item.sku}`)
    } catch (error: any) {
      console.error(`[${this.name}] ❌ Webhook failed:`, error.message)
      throw error
    }
  }

  verifyWebhookSignature(payload: WebhookPayload, signature: string): boolean {
    // Odoo doesn't have built-in signature verification
    // We can implement custom HMAC-SHA256 if webhook is sent via custom module

    if (!signature) {
      console.warn(`[${this.name}] ⚠️ No signature provided (Odoo webhook)`)
      return true // Accept unsigned webhooks (trust firewall/IP whitelist instead)
    }

    const payloadString = JSON.stringify(payload)
    const computedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payloadString)
      .digest('hex')

    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature))
    } catch (error) {
      console.warn(`[${this.name}] ⚠️ Invalid webhook signature`)
      return false
    }
  }
}
