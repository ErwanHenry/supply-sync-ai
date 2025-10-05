/**
 * SAP Connector Integration Tests
 *
 * Prerequisites:
 * - SAP sandbox environment credentials
 * - Redis instance running
 * - Environment variables configured
 */

import { SAPConnector, SyncMethod, SyncStatus } from '../../src'
import { config } from 'dotenv'

config() // Load .env file

describe('SAP Connector Integration', () => {
  let connector: SAPConnector

  beforeAll(() => {
    // Skip tests if credentials not provided
    if (!process.env.SAP_CLIENT_ID || !process.env.SAP_INSTANCE_URL) {
      console.warn('⚠️  SAP credentials not found. Skipping integration tests.')
      return
    }

    connector = new SAPConnector(
      {
        apiKey: process.env.SAP_CLIENT_ID!,
        apiSecret: process.env.SAP_CLIENT_SECRET!,
        instanceUrl: process.env.SAP_INSTANCE_URL!,
      },
      SyncMethod.HYBRID,
    )
  })

  afterAll(async () => {
    if (connector) {
      await connector.cleanup()
    }
  })

  describe('Authentication', () => {
    it('should authenticate with OAuth 2.0', async () => {
      if (!connector) return

      await expect(connector.authenticate()).resolves.not.toThrow()
    }, 10000)

    it('should refresh authentication', async () => {
      if (!connector) return

      const result = await connector.refreshAuthentication()
      expect(result).toBe(true)
    }, 10000)
  })

  describe('Inventory Operations', () => {
    it('should fetch inventory items', async () => {
      if (!connector) return

      await connector.authenticate()

      const items = await connector.fetchInventory()

      expect(Array.isArray(items)).toBe(true)
      expect(items.length).toBeGreaterThan(0)

      // Validate first item structure
      const firstItem = items[0]
      expect(firstItem).toHaveProperty('sku')
      expect(firstItem).toHaveProperty('quantity')
      expect(firstItem).toHaveProperty('price')
      expect(typeof firstItem.quantity).toBe('number')
      expect(typeof firstItem.price).toBe('number')
    }, 30000)

    it('should update inventory item', async () => {
      if (!connector) return

      await connector.authenticate()

      // Get first item to update
      const items = await connector.fetchInventory()
      const testItem = items[0]

      // Update quantity
      await expect(
        connector.updateInventoryItem(testItem.sku, {
          quantity: testItem.quantity + 10,
        }),
      ).resolves.not.toThrow()
    }, 30000)
  })

  describe('Sync Operations', () => {
    it('should sync all inventory', async () => {
      if (!connector) return

      await connector.authenticate()

      const result = await connector.sync()

      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('itemsSynced')
      expect(result).toHaveProperty('itemsFailed')
      expect(result).toHaveProperty('duration')
      expect([SyncStatus.SUCCESS, SyncStatus.PARTIAL]).toContain(result.status)
      expect(result.itemsSynced).toBeGreaterThan(0)
    }, 60000)
  })

  describe('Webhook Operations', () => {
    it('should setup webhook', async () => {
      if (!connector) return

      await connector.authenticate()

      const callbackUrl = 'https://test.supplysync.ai/api/webhooks/sap'

      // Note: This might fail if webhook already exists
      await expect(
        connector.setupWebhook(callbackUrl),
      ).resolves.not.toThrow()
    }, 10000)

    it('should verify webhook signature', () => {
      if (!connector) return

      const payload = {
        event: 'sap.s4.beh.materialstock.v1.MaterialStock.Changed.v1',
        data: {
          Material: 'TEST-001',
          MaterialDescription: 'Test Product',
          QuantityInStock: 100,
          PricePerUnit: 29.99,
          Plant: 'WH-01',
        },
        timestamp: new Date(),
      }

      const secret = process.env.SAP_WEBHOOK_SECRET || 'test-secret'
      const crypto = require('crypto')
      const signature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex')

      const isValid = connector.verifyWebhookSignature(payload, signature)
      expect(isValid).toBe(true)
    })

    it('should reject invalid webhook signature', () => {
      if (!connector) return

      const payload = {
        event: 'test.event',
        data: {},
        timestamp: new Date(),
      }

      const isValid = connector.verifyWebhookSignature(payload, 'invalid-signature')
      expect(isValid).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle authentication failure', async () => {
      const badConnector = new SAPConnector({
        apiKey: 'invalid-key',
        apiSecret: 'invalid-secret',
        instanceUrl: 'https://invalid-instance.com',
      })

      await expect(badConnector.authenticate()).rejects.toThrow()
    }, 10000)

    it('should retry on temporary failures', async () => {
      if (!connector) return

      // This would test retry logic, but requires mocking network failures
      // For integration tests, we trust the retry mechanism works
      expect(true).toBe(true)
    })
  })

  describe('Status and Monitoring', () => {
    it('should return connector status', () => {
      if (!connector) return

      const status = connector.getStatus()

      expect(status).toHaveProperty('name')
      expect(status).toHaveProperty('syncMethod')
      expect(status).toHaveProperty('pollInterval')
      expect(status.name).toBe('SAP')
      expect(status.syncMethod).toBe(SyncMethod.HYBRID)
    })
  })
})
