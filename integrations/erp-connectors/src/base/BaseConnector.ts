/**
 * Base ERP Connector
 *
 * Abstract class that all ERP connectors must extend.
 * Provides common functionality for authentication, sync, webhooks, and retry logic.
 */

import axios, { AxiosInstance } from 'axios'
import Redis from 'ioredis'
import { z } from 'zod'

// Common schemas
export const InventoryItemSchema = z.object({
  sku: z.string(),
  name: z.string().optional(),
  quantity: z.number().int(),
  price: z.number(),
  supplierId: z.string().optional(),
  warehouseId: z.string().optional(),
  lastUpdated: z.date().optional(),
})

export type InventoryItem = z.infer<typeof InventoryItemSchema>

export const ERPCredentialsSchema = z.object({
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  oauthToken: z.string().optional(),
  refreshToken: z.string().optional(),
  instanceUrl: z.string().url(),
  companyId: z.string().optional(),
})

export type ERPCredentials = z.infer<typeof ERPCredentialsSchema>

export enum SyncMethod {
  WEBHOOK = 'webhook',
  POLLING = 'polling',
  HYBRID = 'hybrid',
}

export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  ERROR = 'error',
  PARTIAL = 'partial',
}

export interface SyncResult {
  status: SyncStatus
  itemsSynced: number
  itemsFailed: number
  errors: Array<{ sku: string; error: string }>
  duration: number
  timestamp: Date
}

export interface WebhookPayload {
  event: string
  data: any
  timestamp: Date
  signature?: string
}

/**
 * Base Connector Abstract Class
 */
export abstract class BaseConnector {
  protected name: string
  protected credentials: ERPCredentials
  protected httpClient: AxiosInstance
  protected redis: Redis
  protected syncMethod: SyncMethod
  protected pollInterval: number // milliseconds
  protected lastSyncAt?: Date

  constructor(
    name: string,
    credentials: ERPCredentials,
    syncMethod: SyncMethod = SyncMethod.HYBRID,
    pollInterval: number = 300000 // 5 minutes default
  ) {
    this.name = name
    this.credentials = ERPCredentialsSchema.parse(credentials)
    this.syncMethod = syncMethod
    this.pollInterval = pollInterval

    // Initialize HTTP client with default config
    this.httpClient = axios.create({
      baseURL: credentials.instanceUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SupplySync-AI/1.0',
      },
    })

    // Add request/response interceptors for logging and error handling
    this.setupInterceptors()

    // Initialize Redis for caching
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryStrategy: (times) => Math.min(times * 50, 2000),
    })
  }

  /**
   * Setup axios interceptors for logging and error handling
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.httpClient.interceptors.request.use(
      (config) => {
        console.log(`[${this.name}] ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        console.error(`[${this.name}] Request error:`, error)
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.httpClient.interceptors.response.use(
      (response) => {
        console.log(`[${this.name}] Response ${response.status}`)
        return response
      },
      async (error) => {
        console.error(`[${this.name}] Response error:`, error.message)

        // Handle rate limiting (429)
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '60')
          console.warn(`[${this.name}] Rate limited. Retrying after ${retryAfter}s`)
          await this.sleep(retryAfter * 1000)
          return this.httpClient.request(error.config)
        }

        // Handle auth errors (401)
        if (error.response?.status === 401) {
          console.warn(`[${this.name}] Auth error. Attempting to refresh token...`)
          const refreshed = await this.refreshAuthentication()
          if (refreshed) {
            return this.httpClient.request(error.config)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  /**
   * Abstract methods that must be implemented by each connector
   */
  abstract authenticate(): Promise<void>
  abstract refreshAuthentication(): Promise<boolean>
  abstract fetchInventory(): Promise<InventoryItem[]>
  abstract updateInventoryItem(sku: string, data: Partial<InventoryItem>): Promise<void>
  abstract setupWebhook(callbackUrl: string): Promise<void>
  abstract handleWebhook(payload: WebhookPayload): Promise<void>
  abstract verifyWebhookSignature(payload: WebhookPayload, signature: string): boolean

  /**
   * Sync inventory from ERP to SupplySync
   */
  async sync(): Promise<SyncResult> {
    const startTime = Date.now()
    const result: SyncResult = {
      status: SyncStatus.SYNCING,
      itemsSynced: 0,
      itemsFailed: 0,
      errors: [],
      duration: 0,
      timestamp: new Date(),
    }

    try {
      console.log(`[${this.name}] Starting sync...`)

      // Fetch inventory from ERP
      const items = await this.fetchInventory()
      console.log(`[${this.name}] Fetched ${items.length} items`)

      // Process items with retry logic
      for (const item of items) {
        try {
          await this.processInventoryItem(item)
          result.itemsSynced++
        } catch (error: any) {
          result.itemsFailed++
          result.errors.push({
            sku: item.sku,
            error: error.message,
          })
          console.error(`[${this.name}] Failed to process ${item.sku}:`, error.message)
        }
      }

      // Update status
      result.status = result.itemsFailed === 0 ? SyncStatus.SUCCESS : SyncStatus.PARTIAL
      result.duration = Date.now() - startTime
      this.lastSyncAt = new Date()

      console.log(`[${this.name}] Sync completed: ${result.itemsSynced} synced, ${result.itemsFailed} failed in ${result.duration}ms`)

      return result
    } catch (error: any) {
      result.status = SyncStatus.ERROR
      result.duration = Date.now() - startTime
      result.errors.push({ sku: 'GLOBAL', error: error.message })

      console.error(`[${this.name}] Sync failed:`, error)

      return result
    }
  }

  /**
   * Process a single inventory item (save to database, trigger anomaly detection, etc.)
   */
  protected async processInventoryItem(item: InventoryItem): Promise<void> {
    // Validate item
    const validated = InventoryItemSchema.parse(item)

    // Cache item in Redis (TTL: 1 hour)
    const cacheKey = `${this.name}:inventory:${validated.sku}`
    await this.redis.setex(cacheKey, 3600, JSON.stringify(validated))

    // TODO: Send to backend API for processing
    // await this.sendToBackend(validated)

    console.log(`[${this.name}] Processed ${validated.sku}`)
  }

  /**
   * Exponential backoff retry logic
   */
  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 5,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        if (attempt === maxRetries - 1) throw error

        const delay = Math.min(baseDelay * Math.pow(2, attempt) + Math.random() * 1000, 30000)
        console.warn(`[${this.name}] Retry ${attempt + 1}/${maxRetries} after ${delay}ms`)
        await this.sleep(delay)
      }
    }

    throw new Error('Max retries exceeded')
  }

  /**
   * Start polling (if sync method is polling or hybrid)
   */
  startPolling(): void {
    if (this.syncMethod === SyncMethod.WEBHOOK) {
      console.log(`[${this.name}] Polling disabled (webhook-only mode)`)
      return
    }

    console.log(`[${this.name}] Starting polling every ${this.pollInterval}ms`)

    setInterval(async () => {
      try {
        await this.sync()
      } catch (error) {
        console.error(`[${this.name}] Polling sync failed:`, error)
      }
    }, this.pollInterval)
  }

  /**
   * Utility: Sleep for N milliseconds
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Get connector status
   */
  getStatus(): {
    name: string
    syncMethod: SyncMethod
    pollInterval: number
    lastSyncAt?: Date
  } {
    return {
      name: this.name,
      syncMethod: this.syncMethod,
      pollInterval: this.pollInterval,
      lastSyncAt: this.lastSyncAt,
    }
  }

  /**
   * Cleanup (close connections)
   */
  async cleanup(): Promise<void> {
    await this.redis.quit()
    console.log(`[${this.name}] Cleaned up`)
  }
}
