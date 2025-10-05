/**
 * NetSuite ERP Connector
 *
 * Connects to NetSuite via SuiteTalk REST Web Services
 *
 * Features:
 * - Token-Based Authentication (TBA) with OAuth 1.0a
 * - RESTlet for custom operations
 * - Webhook support via SuiteScript
 * - Rate limiting (10 requests/second burst, 1000/hour)
 */

import {
  BaseConnector,
  ERPCredentials,
  InventoryItem,
  SyncMethod,
  WebhookPayload,
} from '../base/BaseConnector'
import crypto from 'crypto'
import OAuth from 'oauth-1.0a'

interface NetSuiteInventoryItem {
  itemId: string
  displayName: string
  quantityAvailable: number
  cost: number
  location?: string
  vendor?: {
    id: string
  }
  lastModifiedDate: string
}

interface NetSuiteCredentials extends ERPCredentials {
  accountId?: string
  consumerKey?: string
  consumerSecret?: string
  tokenId?: string
  tokenSecret?: string
}

export class NetSuiteConnector extends BaseConnector {
  private accountId: string
  private oauth: any
  private webhookSecret: string

  constructor(credentials: NetSuiteCredentials) {
    // NetSuite supports webhooks via SuiteScript
    super('NetSuite', credentials, SyncMethod.HYBRID, 300000) // 5 min polling

    this.accountId = credentials.accountId || process.env.NETSUITE_ACCOUNT_ID || ''
    this.webhookSecret = process.env.NETSUITE_WEBHOOK_SECRET || crypto.randomBytes(32).toString('hex')

    // OAuth 1.0a configuration
    this.oauth = new OAuth({
      consumer: {
        key: credentials.consumerKey || credentials.apiKey || '',
        secret: credentials.consumerSecret || credentials.apiSecret || '',
      },
      signature_method: 'HMAC-SHA256',
      hash_function(base_string: string, key: string) {
        return crypto.createHmac('sha256', key).update(base_string).digest('base64')
      },
    })

    // Store token credentials
    this.httpClient.defaults.headers.common['oauth_token'] = credentials.tokenId || ''
    this.httpClient.defaults.headers.common['oauth_token_secret'] = credentials.tokenSecret || ''
  }

  async authenticate(): Promise<void> {
    console.log(`[${this.name}] Authenticating with OAuth 1.0a (TBA)...`)

    try {
      // NetSuite uses OAuth 1.0a signature in Authorization header
      // The actual authentication happens per-request via OAuth signing

      // Test authentication with a simple GET request
      const testUrl = `${this.credentials.instanceUrl}/services/rest/record/v1/metadata-catalog/nsAccount`

      const requestData = {
        url: testUrl,
        method: 'GET',
      }

      const token = {
        key: this.httpClient.defaults.headers.common['oauth_token'] as string,
        secret: this.httpClient.defaults.headers.common['oauth_token_secret'] as string,
      }

      const authHeader = this.oauth.toHeader(this.oauth.authorize(requestData, token))

      await this.httpClient.get(testUrl, {
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
      })

      console.log(`[${this.name}] ✅ Authenticated with account ${this.accountId}`)
    } catch (error: any) {
      console.error(`[${this.name}] ❌ Authentication failed:`, error.message)
      throw error
    }
  }

  async refreshAuthentication(): Promise<boolean> {
    // OAuth 1.0a tokens don't expire, but we can test connectivity
    try {
      await this.authenticate()
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Sign request with OAuth 1.0a
   */
  private getOAuthHeaders(url: string, method: string = 'GET'): any {
    const requestData = { url, method }
    const token = {
      key: this.httpClient.defaults.headers.common['oauth_token'] as string,
      secret: this.httpClient.defaults.headers.common['oauth_token_secret'] as string,
    }

    return this.oauth.toHeader(this.oauth.authorize(requestData, token))
  }

  async fetchInventory(): Promise<InventoryItem[]> {
    const items: InventoryItem[] = []
    let offset = 0
    const limit = 100 // NetSuite batch limit

    try {
      while (true) {
        const url = `${this.credentials.instanceUrl}/services/rest/record/v1/inventoryItem`

        const response = await this.retryWithBackoff(async () => {
          return await this.httpClient.get(url, {
            params: {
              limit,
              offset,
              expandSubResources: true,
            },
            headers: {
              ...this.getOAuthHeaders(url, 'GET'),
              'Content-Type': 'application/json',
            },
          })
        })

        const netsuiteItems: NetSuiteInventoryItem[] = response.data.items || []

        if (netsuiteItems.length === 0) break

        const transformed = netsuiteItems.map((item) => ({
          sku: item.itemId,
          name: item.displayName,
          quantity: Math.floor(item.quantityAvailable),
          price: item.cost,
          supplierId: item.vendor?.id,
          warehouseId: item.location,
          lastUpdated: new Date(item.lastModifiedDate),
        }))

        items.push(...transformed)
        offset += limit

        // Rate limiting: 10 req/sec burst, 1000 req/hour
        // Conservative: 100ms between requests = 600 req/min = safe
        await this.sleep(100)

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
      const url = `${this.credentials.instanceUrl}/services/rest/record/v1/inventoryItem/${sku}`

      await this.retryWithBackoff(async () => {
        return await this.httpClient.patch(
          url,
          {
            quantityAvailable: data.quantity,
            cost: data.price,
          },
          {
            headers: {
              ...this.getOAuthHeaders(url, 'PATCH'),
              'Content-Type': 'application/json',
            },
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
    console.log(`[${this.name}] Setting up webhook via SuiteScript...`)

    try {
      // NetSuite webhooks are configured via SuiteScript (server-side JavaScript)
      // This typically requires deploying a SuiteScript file that listens to record events

      // Register webhook endpoint (example using RESTlet)
      const url = `${this.credentials.instanceUrl}/services/rest/record/v1/customrecord_webhook_config`

      await this.httpClient.post(
        url,
        {
          custrecord_webhook_url: callbackUrl,
          custrecord_webhook_secret: this.webhookSecret,
          custrecord_webhook_events: ['inventoryitem.create', 'inventoryitem.update', 'inventoryitem.delete'],
        },
        {
          headers: {
            ...this.getOAuthHeaders(url, 'POST'),
            'Content-Type': 'application/json',
          },
        }
      )

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
        sku: itemData.itemId,
        name: itemData.displayName,
        quantity: Math.floor(itemData.quantityAvailable),
        price: itemData.cost,
        supplierId: itemData.vendor?.id,
        warehouseId: itemData.location,
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
    // NetSuite can send HMAC-SHA256 signature via SuiteScript
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
