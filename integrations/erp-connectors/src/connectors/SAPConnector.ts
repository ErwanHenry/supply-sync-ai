/**
 * SAP ERP Connector
 *
 * Connects to SAP S/4HANA Cloud or SAP Business One via OData API
 *
 * Features:
 * - OAuth 2.0 authentication
 * - Webhook support for real-time updates
 * - Polling fallback (5-minute intervals)
 * - Rate limiting (100 requests/minute)
 */

import {
  BaseConnector,
  ERPCredentials,
  InventoryItem,
  SyncMethod,
  WebhookPayload,
} from '../base/BaseConnector'
import crypto from 'crypto'

interface SAPInventoryItem {
  Material: string // SKU
  MaterialDescription: string
  QuantityInStock: number
  PricePerUnit: number
  Plant: string // Warehouse ID
  Supplier?: string
  LastChangeDate: string
}

export class SAPConnector extends BaseConnector {
  private accessToken?: string
  private tokenExpiresAt?: Date
  private webhookSecret: string

  constructor(credentials: ERPCredentials, syncMethod: SyncMethod = SyncMethod.HYBRID) {
    super('SAP', credentials, syncMethod, 300000) // 5 min polling
    this.webhookSecret = process.env.SAP_WEBHOOK_SECRET || crypto.randomBytes(32).toString('hex')
  }

  /**
   * Authenticate with SAP using OAuth 2.0 Client Credentials flow
   */
  async authenticate(): Promise<void> {
    console.log(`[${this.name}] Authenticating with OAuth 2.0...`)

    try {
      const response = await this.httpClient.post('/oauth/token', {
        grant_type: 'client_credentials',
        client_id: this.credentials.apiKey,
        client_secret: this.credentials.apiSecret,
      })

      this.accessToken = response.data.access_token
      const expiresIn = response.data.expires_in || 3600 // Default 1 hour
      this.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000)

      // Set Authorization header
      this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`

      console.log(`[${this.name}] ✅ Authenticated (expires in ${expiresIn}s)`)
    } catch (error: any) {
      console.error(`[${this.name}] ❌ Authentication failed:`, error.message)
      throw new Error(`SAP authentication failed: ${error.message}`)
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshAuthentication(): Promise<boolean> {
    try {
      await this.authenticate()
      return true
    } catch (error) {
      console.error(`[${this.name}] Token refresh failed`)
      return false
    }
  }

  /**
   * Check if token is expired and refresh if needed
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiresAt || this.tokenExpiresAt < new Date()) {
      await this.authenticate()
    }
  }

  /**
   * Fetch inventory from SAP OData API
   *
   * Endpoint: /sap/opu/odata/sap/API_MATERIAL_STOCK_SRV/A_MaterialStock
   */
  async fetchInventory(): Promise<InventoryItem[]> {
    await this.ensureAuthenticated()

    const items: InventoryItem[] = []
    let skip = 0
    const top = 100 // Batch size (SAP limit: 1000)

    try {
      while (true) {
        const response = await this.retryWithBackoff(async () => {
          return await this.httpClient.get('/sap/opu/odata/sap/API_MATERIAL_STOCK_SRV/A_MaterialStock', {
            params: {
              $top: top,
              $skip: skip,
              $format: 'json',
            },
          })
        })

        const sapItems: SAPInventoryItem[] = response.data.d?.results || []

        if (sapItems.length === 0) break

        // Transform SAP format to SupplySync format
        const transformed = sapItems.map((sapItem) => this.transformSAPItem(sapItem))
        items.push(...transformed)

        skip += top

        // Rate limiting: 100 requests/min = 600ms between requests
        await this.sleep(600)

        console.log(`[${this.name}] Fetched ${items.length} items so far...`)
      }

      console.log(`[${this.name}] Total fetched: ${items.length} items`)
      return items
    } catch (error: any) {
      console.error(`[${this.name}] Failed to fetch inventory:`, error.message)
      throw error
    }
  }

  /**
   * Transform SAP item to SupplySync format
   */
  private transformSAPItem(sapItem: SAPInventoryItem): InventoryItem {
    return {
      sku: sapItem.Material,
      name: sapItem.MaterialDescription,
      quantity: Math.floor(sapItem.QuantityInStock),
      price: sapItem.PricePerUnit,
      supplierId: sapItem.Supplier,
      warehouseId: sapItem.Plant,
      lastUpdated: new Date(sapItem.LastChangeDate),
    }
  }

  /**
   * Update inventory item in SAP
   */
  async updateInventoryItem(sku: string, data: Partial<InventoryItem>): Promise<void> {
    await this.ensureAuthenticated()

    try {
      await this.retryWithBackoff(async () => {
        return await this.httpClient.patch(
          `/sap/opu/odata/sap/API_MATERIAL_STOCK_SRV/A_MaterialStock('${sku}')`,
          {
            QuantityInStock: data.quantity,
            PricePerUnit: data.price,
          }
        )
      })

      console.log(`[${this.name}] Updated ${sku}`)
    } catch (error: any) {
      console.error(`[${this.name}] Failed to update ${sku}:`, error.message)
      throw error
    }
  }

  /**
   * Setup webhook for real-time inventory updates
   *
   * SAP Event Mesh / SAP Event Grid
   */
  async setupWebhook(callbackUrl: string): Promise<void> {
    await this.ensureAuthenticated()

    console.log(`[${this.name}] Setting up webhook: ${callbackUrl}`)

    try {
      // Subscribe to Material Stock Change events
      await this.httpClient.post('/sap/eventmesh/subscriptions', {
        name: 'SupplySync_Inventory_Updates',
        events: [
          'sap.s4.beh.materialstock.v1.MaterialStock.Changed.v1',
          'sap.s4.beh.materialstock.v1.MaterialStock.Created.v1',
        ],
        webhook: {
          url: callbackUrl,
          method: 'POST',
          headers: {
            'X-Webhook-Secret': this.webhookSecret,
          },
        },
      })

      console.log(`[${this.name}] ✅ Webhook configured`)
    } catch (error: any) {
      console.error(`[${this.name}] ❌ Webhook setup failed:`, error.message)

      // Fallback to polling if webhook fails
      if (this.syncMethod === SyncMethod.HYBRID) {
        console.warn(`[${this.name}] Falling back to polling mode`)
        this.startPolling()
      } else {
        throw error
      }
    }
  }

  /**
   * Handle incoming webhook payload
   */
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    console.log(`[${this.name}] Received webhook: ${payload.event}`)

    try {
      // Extract material data from SAP event
      const materialData = payload.data?.MaterialStock || payload.data

      const item: InventoryItem = {
        sku: materialData.Material,
        name: materialData.MaterialDescription,
        quantity: Math.floor(materialData.QuantityInStock),
        price: materialData.PricePerUnit,
        supplierId: materialData.Supplier,
        warehouseId: materialData.Plant,
        lastUpdated: new Date(),
      }

      // Process item (save to DB, trigger anomaly detection)
      await this.processInventoryItem(item)

      console.log(`[${this.name}] ✅ Webhook processed: ${item.sku}`)
    } catch (error: any) {
      console.error(`[${this.name}] ❌ Webhook processing failed:`, error.message)
      throw error
    }
  }

  /**
   * Verify webhook signature (HMAC-SHA256)
   */
  verifyWebhookSignature(payload: WebhookPayload, signature: string): boolean {
    const payloadString = JSON.stringify(payload)
    const computedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payloadString)
      .digest('hex')

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature)
    )

    if (!isValid) {
      console.warn(`[${this.name}] ⚠️ Invalid webhook signature`)
    }

    return isValid
  }
}
