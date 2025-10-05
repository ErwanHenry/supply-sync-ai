import { create } from 'zustand'

interface InventoryItem {
  id: string
  sku: string
  name: string
  quantity: number
  price: number
  lastSyncAt: string
}

interface Anomaly {
  id: string
  inventoryId: string
  anomalyType: string
  severity: string
  confidence: number
  description: string
  createdAt: string
  status: string
}

interface SyncLog {
  id: string
  erpType: string
  status: string
  itemsSynced: number
  startedAt: string
  completedAt?: string
}

interface InventoryStore {
  inventory: InventoryItem[]
  anomalies: Anomaly[]
  syncLogs: SyncLog[]
  updateInventory: (message: any) => void
  addAnomaly: (anomaly: Anomaly) => void
  addSyncLog: (log: SyncLog) => void
  setInventory: (items: InventoryItem[]) => void
  setAnomalies: (anomalies: Anomaly[]) => void
}

export const useInventoryStore = create<InventoryStore>((set) => ({
  inventory: [],
  anomalies: [],
  syncLogs: [],

  updateInventory: (message) => {
    if (message.type === 'inventory:update') {
      set((state) => ({
        inventory: state.inventory.map((item) =>
          item.id === message.data.id ? { ...item, ...message.data } : item
        ),
      }))
    } else if (message.type === 'anomaly:detected') {
      set((state) => ({
        anomalies: [message.data, ...state.anomalies].slice(0, 100), // Keep last 100
      }))
    } else if (message.type === 'sync:completed') {
      set((state) => ({
        syncLogs: [message.data, ...state.syncLogs].slice(0, 50), // Keep last 50
      }))
    }
  },

  addAnomaly: (anomaly) =>
    set((state) => ({
      anomalies: [anomaly, ...state.anomalies].slice(0, 100),
    })),

  addSyncLog: (log) =>
    set((state) => ({
      syncLogs: [log, ...state.syncLogs].slice(0, 50),
    })),

  setInventory: (items) => set({ inventory: items }),

  setAnomalies: (anomalies) => set({ anomalies }),
}))
