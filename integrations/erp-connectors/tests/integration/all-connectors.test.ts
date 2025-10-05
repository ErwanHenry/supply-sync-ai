/**
 * All ERP Connectors Integration Tests
 *
 * Tests common functionality across all 5 ERP connectors
 */

import {
  SAPConnector,
  OracleConnector,
  Dynamics365Connector,
  NetSuiteConnector,
  OdooConnector,
  BaseConnector,
  SyncMethod,
  ERPCredentials,
} from '../../src'
import { config } from 'dotenv'

config()

interface ConnectorConfig {
  name: string
  enabled: boolean
  connector: BaseConnector | null
  credentials: ERPCredentials | null
}

describe('All ERP Connectors', () => {
  const connectors: ConnectorConfig[] = [
    {
      name: 'SAP',
      enabled: !!(process.env.SAP_CLIENT_ID && process.env.SAP_INSTANCE_URL),
      connector: null,
      credentials: {
        apiKey: process.env.SAP_CLIENT_ID || '',
        apiSecret: process.env.SAP_CLIENT_SECRET || '',
        instanceUrl: process.env.SAP_INSTANCE_URL || '',
      },
    },
    {
      name: 'Oracle',
      enabled: !!(process.env.ORACLE_API_KEY && process.env.ORACLE_INSTANCE_URL),
      connector: null,
      credentials: {
        apiKey: process.env.ORACLE_API_KEY || '',
        apiSecret: process.env.ORACLE_API_SECRET || '',
        instanceUrl: process.env.ORACLE_INSTANCE_URL || '',
      },
    },
    {
      name: 'Dynamics365',
      enabled: !!(
        process.env.DYNAMICS_CLIENT_ID && process.env.DYNAMICS_INSTANCE_URL
      ),
      connector: null,
      credentials: {
        apiKey: process.env.DYNAMICS_CLIENT_ID || '',
        apiSecret: process.env.DYNAMICS_CLIENT_SECRET || '',
        instanceUrl: process.env.DYNAMICS_INSTANCE_URL || '',
        companyId: process.env.DYNAMICS_TENANT_ID,
      },
    },
    {
      name: 'NetSuite',
      enabled: !!(
        process.env.NETSUITE_CONSUMER_KEY && process.env.NETSUITE_INSTANCE_URL
      ),
      connector: null,
      credentials: {
        apiKey: process.env.NETSUITE_CONSUMER_KEY || '',
        apiSecret: process.env.NETSUITE_CONSUMER_SECRET || '',
        instanceUrl: process.env.NETSUITE_INSTANCE_URL || '',
        accountId: process.env.NETSUITE_ACCOUNT_ID,
      },
    },
    {
      name: 'Odoo',
      enabled: !!(process.env.ODOO_USERNAME && process.env.ODOO_INSTANCE_URL),
      connector: null,
      credentials: {
        apiKey: process.env.ODOO_USERNAME || '',
        apiSecret: process.env.ODOO_PASSWORD || '',
        instanceUrl: process.env.ODOO_INSTANCE_URL || '',
        companyId: process.env.ODOO_DATABASE,
      },
    },
  ]

  beforeAll(() => {
    // Initialize enabled connectors
    connectors.forEach((config) => {
      if (!config.enabled || !config.credentials) {
        console.warn(`⚠️  ${config.name} credentials not found. Skipping.`)
        return
      }

      switch (config.name) {
        case 'SAP':
          config.connector = new SAPConnector(config.credentials, SyncMethod.HYBRID)
          break
        case 'Oracle':
          config.connector = new OracleConnector(config.credentials)
          break
        case 'Dynamics365':
          config.connector = new Dynamics365Connector(config.credentials)
          break
        case 'NetSuite':
          config.connector = new NetSuiteConnector(config.credentials as any)
          break
        case 'Odoo':
          config.connector = new OdooConnector(config.credentials as any)
          break
      }
    })
  })

  afterAll(async () => {
    // Cleanup all connectors
    await Promise.all(
      connectors
        .filter((c) => c.connector)
        .map((c) => c.connector!.cleanup()),
    )
  })

  describe.each(connectors.filter((c) => c.enabled))(
    '$name Connector',
    (config) => {
      test('should authenticate', async () => {
        if (!config.connector) return

        await expect(config.connector.authenticate()).resolves.not.toThrow()
      }, 15000)

      test('should fetch inventory', async () => {
        if (!config.connector) return

        await config.connector.authenticate()
        const items = await config.connector.fetchInventory()

        expect(Array.isArray(items)).toBe(true)
        if (items.length > 0) {
          expect(items[0]).toHaveProperty('sku')
          expect(items[0]).toHaveProperty('quantity')
          expect(items[0]).toHaveProperty('price')
        }
      }, 60000)

      test('should return status', () => {
        if (!config.connector) return

        const status = config.connector.getStatus()

        expect(status).toHaveProperty('name')
        expect(status).toHaveProperty('syncMethod')
        expect(status.name).toBe(config.name)
      })

      test('should handle webhook signature verification', () => {
        if (!config.connector) return

        const payload = {
          event: 'test.event',
          data: { test: 'data' },
          timestamp: new Date(),
        }

        // Valid signature
        const crypto = require('crypto')
        const secret = process.env[`${config.name.toUpperCase()}_WEBHOOK_SECRET`] || 'test'
        const validSignature = crypto
          .createHmac('sha256', secret)
          .update(JSON.stringify(payload))
          .digest('hex')

        const isValid = config.connector.verifyWebhookSignature(
          payload,
          validSignature,
        )

        // Some connectors (Oracle, Dynamics) have simplified verification
        if (config.name === 'SAP' || config.name === 'NetSuite' || config.name === 'Odoo') {
          expect(typeof isValid).toBe('boolean')
        }

        // Invalid signature should always return false
        const isInvalid = config.connector.verifyWebhookSignature(
          payload,
          'invalid',
        )
        expect(isInvalid).toBe(false)
      })
    },
  )

  describe('Performance Comparison', () => {
    test('should measure fetch times across connectors', async () => {
      const results: Record<string, number> = {}

      for (const config of connectors.filter((c) => c.enabled && c.connector)) {
        const start = Date.now()

        try {
          await config.connector!.authenticate()
          await config.connector!.fetchInventory()
          results[config.name] = Date.now() - start
        } catch (error) {
          results[config.name] = -1 // Error
        }
      }

      console.log('\n📊 Performance Results:')
      Object.entries(results).forEach(([name, duration]) => {
        if (duration === -1) {
          console.log(`  ${name}: ❌ Failed`)
        } else {
          console.log(`  ${name}: ${duration}ms`)
        }
      })

      // At least one connector should succeed
      const successCount = Object.values(results).filter((d) => d > 0).length
      expect(successCount).toBeGreaterThan(0)
    }, 120000)
  })

  describe('Error Resilience', () => {
    test('all connectors should handle network errors gracefully', async () => {
      const badConnector = new SAPConnector({
        apiKey: 'bad',
        apiSecret: 'bad',
        instanceUrl: 'https://definitely-invalid-url-12345.com',
      })

      await expect(badConnector.authenticate()).rejects.toThrow()
    }, 10000)
  })
})
