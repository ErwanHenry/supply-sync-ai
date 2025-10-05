/**
 * ERP Connectors Index
 *
 * Export all ERP connectors and base classes
 */

export { BaseConnector, SyncMethod, SyncStatus } from './base/BaseConnector'
export type {
  InventoryItem,
  ERPCredentials,
  SyncResult,
  WebhookPayload,
} from './base/BaseConnector'

export { SAPConnector } from './connectors/SAPConnector'
export { OracleConnector } from './connectors/OracleConnector'
export { Dynamics365Connector } from './connectors/Dynamics365Connector'
export { NetSuiteConnector } from './connectors/NetSuiteConnector'
export { OdooConnector } from './connectors/OdooConnector'
