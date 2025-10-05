# ERP Connectors

Enterprise Resource Planning (ERP) connectors for SupplySync AI. Provides unified interface to sync inventory data from major ERP systems.

## Supported ERPs

| ERP System | Auth Method | Sync Methods | Rate Limit | Status |
|------------|-------------|--------------|------------|--------|
| **SAP S/4HANA** | OAuth 2.0 | Webhook + Polling | 100 req/min | ✅ Ready |
| **Oracle Fusion** | Basic Auth | Polling | 60 req/min | ✅ Ready |
| **Microsoft Dynamics 365** | Azure AD OAuth | Webhook + Polling | 100 req/min | ✅ Ready |
| **NetSuite** | OAuth 1.0a (TBA) | Webhook + Polling | 1000 req/hour | ✅ Ready |
| **Odoo** | Username/Password | Webhook + Polling | No limit | ✅ Ready |

## Architecture

All connectors extend `BaseConnector` abstract class:

```typescript
import { SAPConnector, OracleConnector, Dynamics365Connector, NetSuiteConnector, OdooConnector } from '@supply-sync/erp-connectors'

// SAP Example
const sapConnector = new SAPConnector({
  apiKey: 'your-client-id',
  apiSecret: 'your-client-secret',
  instanceUrl: 'https://your-sap-instance.com',
})

await sapConnector.authenticate()
const inventory = await sapConnector.fetchInventory()
```

## Features

### Common Functionality (BaseConnector)

- ✅ **Exponential Backoff Retry** - Automatic retry with exponential delay
- ✅ **Rate Limiting** - Connector-specific rate limit enforcement
- ✅ **Redis Caching** - 1-hour TTL for inventory items
- ✅ **Webhook Support** - Real-time updates via webhooks
- ✅ **Polling Fallback** - Hybrid mode with automatic fallback
- ✅ **Token Refresh** - Automatic OAuth token refresh on 401
- ✅ **Error Handling** - Comprehensive error logging and handling

### Connector-Specific Features

#### SAP Connector
- OAuth 2.0 Client Credentials flow
- OData API v4 (`/sap/opu/odata/sap/API_MATERIAL_STOCK_SRV`)
- SAP Event Mesh webhooks
- HMAC-SHA256 signature verification
- Batch fetching with pagination

#### Oracle Connector
- Basic Authentication
- REST API (`/fscmRestApi/resources/11.13.18.05`)
- Polling-only (limited webhook support)
- 500 items per batch

#### Dynamics 365 Connector
- Azure AD OAuth 2.0 with Tenant ID
- OData API (`/data/InventoryOnHandItems`)
- Azure Service Bus webhooks
- Change tracking for incremental sync

#### NetSuite Connector
- OAuth 1.0a Token-Based Authentication (TBA)
- SuiteTalk REST Web Services
- RESTlet custom operations
- SuiteScript webhook integration
- 10 req/sec burst limit

#### Odoo Connector
- Simple username/password auth
- JSON-RPC External API
- Automated actions for webhooks
- No strict rate limiting
- XML-RPC legacy support

## Installation

```bash
npm install
```

## Environment Variables

Create `.env` file:

```bash
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# SAP
SAP_WEBHOOK_SECRET=your-webhook-secret

# Oracle
# (No specific env vars needed)

# Dynamics 365
DYNAMICS_TENANT_ID=your-tenant-id

# NetSuite
NETSUITE_ACCOUNT_ID=your-account-id
NETSUITE_WEBHOOK_SECRET=your-webhook-secret

# Odoo
ODOO_DATABASE=your-database-name
ODOO_WEBHOOK_SECRET=your-webhook-secret
```

## Usage

### Basic Sync

```typescript
import { SAPConnector, SyncMethod } from '@supply-sync/erp-connectors'

const connector = new SAPConnector(
  {
    apiKey: process.env.SAP_CLIENT_ID,
    apiSecret: process.env.SAP_CLIENT_SECRET,
    instanceUrl: process.env.SAP_INSTANCE_URL,
  },
  SyncMethod.HYBRID // WEBHOOK | POLLING | HYBRID
)

// Authenticate
await connector.authenticate()

// Sync inventory
const result = await connector.sync()
console.log(`Synced ${result.itemsSynced} items in ${result.duration}ms`)

// Start polling (if HYBRID or POLLING mode)
connector.startPolling()
```

### Webhook Setup

```typescript
// Setup webhook
await connector.setupWebhook('https://your-domain.com/api/webhooks/sap')

// In your Express/NestJS webhook handler
app.post('/api/webhooks/sap', async (req, res) => {
  const payload = req.body
  const signature = req.headers['x-webhook-signature']

  // Verify signature
  if (!connector.verifyWebhookSignature(payload, signature)) {
    return res.status(401).send('Invalid signature')
  }

  // Handle webhook
  await connector.handleWebhook(payload)
  res.status(200).send('OK')
})
```

### Update Inventory

```typescript
// Update single item
await connector.updateInventoryItem('SKU-12345', {
  quantity: 150,
  price: 29.99,
})
```

## Testing

```bash
# Unit tests
npm test

# Integration tests (requires live ERP credentials)
npm run test:integration

# Lint
npm run lint
```

## Build

```bash
npm run build
```

Output: `dist/` directory with compiled JavaScript and type definitions.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     BaseConnector                       │
│                   (Abstract Class)                      │
│                                                         │
│  - Retry with exponential backoff                      │
│  - Rate limiting                                       │
│  - Redis caching                                       │
│  - Webhook + Polling hybrid                           │
│  - Token refresh                                       │
└─────────────────────────────────────────────────────────┘
                          ▲
          ┌───────────────┼───────────────┐
          │               │               │
┌─────────┴─────┐  ┌──────┴──────┐  ┌────┴─────┐
│ SAPConnector  │  │   Oracle    │  │ Dynamics │
│               │  │  Connector  │  │  365     │
│ - OAuth 2.0   │  │             │  │          │
│ - OData API   │  │ - Basic Auth│  │ - Azure  │
│ - SAP Event   │  │ - REST API  │  │   AD     │
│   Mesh        │  │ - Polling   │  │ - OData  │
└───────────────┘  └─────────────┘  └──────────┘

┌───────────────┐  ┌─────────────┐
│   NetSuite    │  │    Odoo     │
│   Connector   │  │  Connector  │
│               │  │             │
│ - OAuth 1.0a  │  │ - Username/ │
│ - TBA         │  │   Password  │
│ - SuiteTalk   │  │ - JSON-RPC  │
│ - RESTlet     │  │ - Automated │
└───────────────┘  └─────────────┘
```

## API Reference

### BaseConnector Methods

```typescript
abstract class BaseConnector {
  // Authentication
  abstract authenticate(): Promise<void>
  abstract refreshAuthentication(): Promise<boolean>

  // Inventory operations
  abstract fetchInventory(): Promise<InventoryItem[]>
  abstract updateInventoryItem(sku: string, data: Partial<InventoryItem>): Promise<void>

  // Webhooks
  abstract setupWebhook(callbackUrl: string): Promise<void>
  abstract handleWebhook(payload: WebhookPayload): Promise<void>
  abstract verifyWebhookSignature(payload: WebhookPayload, signature: string): boolean

  // Sync
  sync(): Promise<SyncResult>
  startPolling(): void

  // Utilities
  protected retryWithBackoff<T>(fn: () => Promise<T>, maxRetries?: number): Promise<T>
  protected sleep(ms: number): Promise<void>
  getStatus(): ConnectorStatus
  cleanup(): Promise<void>
}
```

### Types

```typescript
interface InventoryItem {
  sku: string
  name?: string
  quantity: number
  price: number
  supplierId?: string
  warehouseId?: string
  lastUpdated?: Date
}

interface SyncResult {
  status: SyncStatus
  itemsSynced: number
  itemsFailed: number
  errors: Array<{ sku: string; error: string }>
  duration: number
  timestamp: Date
}

enum SyncMethod {
  WEBHOOK = 'webhook',
  POLLING = 'polling',
  HYBRID = 'hybrid',
}

enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  ERROR = 'error',
  PARTIAL = 'partial',
}
```

## Error Handling

All connectors implement comprehensive error handling:

- **Authentication Errors (401)**: Auto-refresh token and retry
- **Rate Limit Errors (429)**: Respect `Retry-After` header
- **Network Errors**: Exponential backoff retry (max 5 attempts)
- **Data Validation**: Zod schema validation for inventory items

## Performance

- **Batch Operations**: All connectors support batch fetching (100-500 items/request)
- **Caching**: Redis cache with 1-hour TTL reduces API calls
- **Parallel Processing**: Process inventory items concurrently
- **Rate Limiting**: Connector-specific delays prevent API throttling

## Security

- **Signature Verification**: HMAC-SHA256 for webhook payloads
- **Timing-Safe Comparison**: Prevents timing attacks on signatures
- **Credentials**: Never log API keys or secrets
- **HTTPS Only**: All API calls use HTTPS

## Contributing

1. Extend `BaseConnector` for new ERPs
2. Implement all abstract methods
3. Add tests in `tests/` directory
4. Update this README with new connector documentation

## License

MIT

## Support

For issues or questions, contact: support@supplysync.ai
