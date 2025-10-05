'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useInventoryStore } from '@/store/inventoryStore'

export default function SyncStatus() {
  const { syncLogs } = useInventoryStore()
  const [localLogs, setLocalLogs] = useState<any[]>([])

  useEffect(() => {
    // Mock data
    setLocalLogs([
      {
        id: '1',
        erpType: 'SAP',
        status: 'success',
        itemsSynced: 1250,
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        completedAt: new Date(Date.now() - 3500000).toISOString(),
        duration: 100000,
      },
      {
        id: '2',
        erpType: 'Oracle',
        status: 'success',
        itemsSynced: 850,
        startedAt: new Date(Date.now() - 7200000).toISOString(),
        completedAt: new Date(Date.now() - 7100000).toISOString(),
        duration: 100000,
      },
      {
        id: '3',
        erpType: 'Dynamics 365',
        status: 'error',
        itemsSynced: 0,
        startedAt: new Date(Date.now() - 10800000).toISOString(),
        errors: { message: 'Connection timeout' },
      },
    ])
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'partial':
        return '⚠️'
      default:
        return '⏳'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Sync Status</h2>
      </div>

      <div className="divide-y divide-gray-200">
        {localLogs.map((log) => (
          <div key={log.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getStatusIcon(log.status)}</span>
                <div>
                  <h3 className="font-medium text-gray-900">{log.erpType}</h3>
                  <p className="text-sm text-gray-500">
                    {format(new Date(log.startedAt), 'PPp')}
                  </p>
                  {log.completedAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      Duration: {((log.duration || 0) / 1000).toFixed(1)}s
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                  {log.status.toUpperCase()}
                </span>
                {log.status === 'success' && (
                  <p className="text-sm text-gray-600 mt-2">
                    {log.itemsSynced.toLocaleString()} items synced
                  </p>
                )}
                {log.status === 'error' && log.errors && (
                  <p className="text-sm text-red-600 mt-2">
                    {log.errors.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
