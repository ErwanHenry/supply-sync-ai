/**
 * Oracle ERP Cloud Connector
 *
 * Connects to Oracle Fusion Cloud ERP via REST API
 *
 * Features:
 * - Basic Auth + API Key
 * - Polling (Oracle has limited webhook support)
 * - Batch operations (500 items/request)
 * - Rate limiting (60 requests/minute)
 */

import {
  BaseConnector,
  ERPCredentials,
  InventoryItem,
  SyncMethod,
  WebhookPayload,
} from '../base/BaseConnector'

interface OracleInventoryItem {
  ItemId: string
  ItemDescription: string
  OnHandQuantity: number
  UnitPrice: number
  OrganizationId: string
  SupplierId?: string
  LastUpdateDate: string
}

export class OracleConnector extends BaseConnector {
  constructor(credentials: ERPCredentials) {
    // Oracle primarily uses polling (limited webhook support)
    super('Oracle', credentials, SyncMethod.POLLING, 300000) // 5 min
  }

  async authenticate(): Promise<void> {
    console.log(`[${this.name}] Authenticating with Basic Auth...`)

    // Oracle uses Basic Auth (username:password base64 encoded)
    const authString = Buffer.from(
      `${this.credentials.apiKey}:${this.credentials.apiSecret}`
    ).toString('base64')

    this.httpClient.defaults.headers.common['Authorization'] = `Basic ${authString}`

    console.log(`[${this.name}] ✅ Authenticated`)
  }

  async refreshAuthentication(): Promise<boolean> {
    // Basic auth doesn't expire, just re-authenticate
    await this.authenticate()
    return true
  }

  async fetchInventory(): Promise<InventoryItem[]> {
    const items: InventoryItem[] = []
    let offset = 0
    const limit = 500 // Oracle batch limit

    try {
      while (true) {
        const response = await this.retryWithBackoff(async () => {
          return await this.httpClient.get('/fscmRestApi/resources/11.13.18.05/itemOrganizationInventoryQuantities', {
            params: {
              onlyData: true,
              limit,
              offset,
            },
          })
        })

        const oracleItems: OracleInventoryItem[] = response.data.items || []

        if (oracleItems.length === 0) break

        const transformed = oracleItems.map((item) => ({
          sku: item.ItemId,
          name: item.ItemDescription,
          quantity: Math.floor(item.OnHandQuantity),
          price: item.UnitPrice,
          supplierId: item.SupplierId,
          warehouseId: item.OrganizationId,
          lastUpdated: new Date(item.LastUpdateDate),
        }))

        items.push(...transformed)
        offset += limit

        // Rate limiting: 60 req/min = 1000ms between requests
        await this.sleep(1000)

        console.log(`[${this.name}] Fetched ${items.length} items...`)
      }

      return items
    } catch (error: any) {
      console.error(`[${this.name}] Failed to fetch inventory:`, error.message)
      throw error
    }
  }

  async updateInventoryItem(sku: string, data: Partial<InventoryItem>): Promise<void> {
    try {
      await this.retryWithBackoff(async () => {
        return await this.httpClient.patch(
          `/fscmRestApi/resources/11.13.18.05/itemOrganizationInventoryQuantities/${sku}`,
          {
            OnHandQuantity: data.quantity,
            UnitPrice: data.price,
          }
        )
      })

      console.log(`[${this.name}] Updated ${sku}`)
    } catch (error: any) {
      console.error(`[${this.name}] Failed to update ${sku}:`, error.message)
      throw error
    }
  }

  async setupWebhook(callbackUrl: string): Promise<void> {
    console.warn(`[${this.name}] Webhook support is limited. Using polling mode.`)
    this.startPolling()
  }

  async handleWebhook(payload: WebhookPayload): Promise<void> {
    console.warn(`[${this.name}] Webhook handler not implemented (polling mode)`)
  }

  verifyWebhookSignature(payload: WebhookPayload, signature: string): boolean {
    return false // Not supported
  }
}
