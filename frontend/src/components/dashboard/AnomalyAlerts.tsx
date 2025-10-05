'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useInventoryStore } from '@/store/inventoryStore'
import { apiClient } from '@/lib/apiClient'

interface Anomaly {
  id: string
  inventoryId: string
  anomalyType: string
  severity: string
  confidence: number
  description: string
  recommendedAction: string
  createdAt: string
  status: string
}

export default function AnomalyAlerts() {
  const { anomalies } = useInventoryStore()
  const [loading, setLoading] = useState(true)
  const [localAnomalies, setLocalAnomalies] = useState<Anomaly[]>([])

  useEffect(() => {
    loadAnomalies()
  }, [])

  // Merge store anomalies with local state
  useEffect(() => {
    if (anomalies.length > 0) {
      setLocalAnomalies((prev) => {
        const newIds = anomalies.map((a: any) => a.id)
        const filtered = prev.filter((a) => !newIds.includes(a.id))
        return [...anomalies, ...filtered] as Anomaly[]
      })
    }
  }, [anomalies])

  const loadAnomalies = async () => {
    try {
      const data = await apiClient.get<Anomaly[]>('/api/v1/anomalies')
      setLocalAnomalies(data)
    } catch (error) {
      console.error('Failed to load anomalies:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300'
    }
  }

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'price_spike':
        return '💰'
      case 'impossible_quantity':
        return '📦'
      case 'stock_jump':
        return '📈'
      default:
        return '⚠️'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Anomaly Alerts</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{localAnomalies.length} total</span>
            <button
              onClick={loadAnomalies}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Anomaly List */}
      <div className="divide-y divide-gray-200">
        {localAnomalies.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Anomalies Detected</h3>
            <p className="text-sm text-gray-500">All inventory data is within normal parameters</p>
          </div>
        ) : (
          localAnomalies.map((anomaly) => (
            <div key={anomaly.id} className="px-6 py-4 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between">
                {/* Left: Anomaly Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getAnomalyIcon(anomaly.anomalyType)}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {anomaly.anomalyType.replace(/_/g, ' ').toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {format(new Date(anomaly.createdAt), 'PPp')}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-3">{anomaly.description}</p>

                  {/* Recommended Action */}
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-sm text-blue-900">
                      <strong>Recommended:</strong> {anomaly.recommendedAction}
                    </p>
                  </div>
                </div>

                {/* Right: Severity & Confidence */}
                <div className="ml-6 flex flex-col items-end gap-2">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full border ${getSeverityColor(
                      anomaly.severity
                    )}`}
                  >
                    {anomaly.severity.toUpperCase()}
                  </span>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Confidence</p>
                    <p className="text-lg font-bold text-gray-900">
                      {(anomaly.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
