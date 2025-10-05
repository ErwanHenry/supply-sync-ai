/**
 * Microsoft Dynamics 365 Connector
 *
 * Connects to Dynamics 365 Finance & Operations via OData API
 *
 * Features:
 * - OAuth 2.0 (Azure AD)
 * - Webhook support via Azure Service Bus
 * - Change tracking for incremental sync
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

interface DynamicsInventoryItem {
  ItemNumber: string
  ProductName: string
  AvailablePhysical: number
  Price: number
  WarehouseId: string
  DefaultSupplier?: string
  ModifiedDateTime: string
}

export class Dynamics365Connector extends BaseConnector {
  private tenantId: string
  private clientId: string
  private clientSecret: string
  private accessToken?: string
  private tokenExpiresAt?: Date

  constructor(credentials: ERPCredentials & { tenantId?: string }) {
    super('Dynamics365', credentials, SyncMethod.HYBRID, 300000)

    this.tenantId = credentials.companyId || process.env.DYNAMICS_TENANT_ID || ''
    this.clientId = credentials.apiKey || ''
    this.clientSecret = credentials.apiSecret || ''
  }

  async authenticate(): Promise<void> {
    console.log(`[${this.name}] Authenticating with Azure AD (OAuth 2.0)...`)

    try {
      const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`

      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials',
        scope: `${this.credentials.instanceUrl}/.default`,
      })

      const response = await this.httpClient.post(tokenUrl, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      this.accessToken = response.data.access_token
      const expiresIn = response.data.expires_in || 3600
      this.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000)

      this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`

      console.log(`[${this.name}] ✅ Authenticated`)
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

  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiresAt || this.tokenExpiresAt < new Date()) {
      await this.authenticate()
    }
  }

  async fetchInventory(): Promise<InventoryItem[]> {
    await this.ensureAuthenticated()

    const items: InventoryItem[] = []
    let skipToken: string | undefined

    try {
      while (true) {
        const url = skipToken
          ? `/data/InventoryOnHandItems?$skiptoken=${skipToken}`
          : '/data/InventoryOnHandItems?$top=100'

        const response = await this.retryWithBackoff(async () => {
          return await this.httpClient.get(url)
        })

        const dynamicsItems: DynamicsInventoryItem[] = response.data.value || []

        if (dynamicsItems.length === 0) break

        const transformed = dynamicsItems.map((item) => ({
          sku: item.ItemNumber,
          name: item.ProductName,
          quantity: Math.floor(item.AvailablePhysical),
          price: item.Price,
          supplierId: item.DefaultSupplier,
          warehouseId: item.WarehouseId,
          lastUpdated: new Date(item.ModifiedDateTime),
        }))

        items.push(...transformed)

        // Check for next page
        skipToken = response.data['@odata.nextLink']?.split('$skiptoken=')[1]
        if (!skipToken) break

        await this.sleep(600) // Rate limiting

        console.log(`[${this.name}] Fetched ${items.length} items...`)
      }

      return items
    } catch (error: any) {
      console.error(`[${this.name}] Failed to fetch inventory:`, error.message)
      throw error
    }
  }

  async updateInventoryItem(sku: string, data: Partial<InventoryItem>): Promise<void> {
    await this.ensureAuthenticated()

    try {
      await this.retryWithBackoff(async () => {
        return await this.httpClient.patch(`/data/InventoryOnHandItems(ItemNumber='${sku}')`, {
          AvailablePhysical: data.quantity,
          Price: data.price,
        })
      })

      console.log(`[${this.name}] Updated ${sku}`)
    } catch (error: any) {
      console.error(`[${this.name}] Failed to update ${sku}:`, error.message)
      throw error
    }
  }

  async setupWebhook(callbackUrl: string): Promise<void> {
    await this.ensureAuthenticated()

    console.log(`[${this.name}] Setting up webhook via Azure Service Bus...`)

    try {
      // Register webhook subscription
      await this.httpClient.post('/data/Webhooks', {
        TargetUrl: callbackUrl,
        EntityName: 'InventoryOnHandItems',
        Events: ['Insert', 'Update', 'Delete'],
      })

      console.log(`[${this.name}] ✅ Webhook configured`)
    } catch (error: any) {
      console.error(`[${this.name}] ❌ Webhook setup failed:`, error.message)

      if (this.syncMethod === SyncMethod.HYBRID) {
        console.warn(`[${this.name}] Falling back to polling`)
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
        sku: itemData.ItemNumber,
        name: itemData.ProductName,
        quantity: Math.floor(itemData.AvailablePhysical),
        price: itemData.Price,
        supplierId: itemData.DefaultSupplier,
        warehouseId: itemData.WarehouseId,
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
    // Dynamics uses Azure AD validation
    // Simplified verification (in production, validate JWT token)
    return signature.length > 0
  }
}
