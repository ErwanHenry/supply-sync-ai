'use client'

import { useState, useEffect } from 'react'
import InventoryOverview from '@/components/dashboard/InventoryOverview'
import AnomalyAlerts from '@/components/dashboard/AnomalyAlerts'
import DemandForecasts from '@/components/dashboard/DemandForecasts'
import SyncStatus from '@/components/dashboard/SyncStatus'
import ERPConnections from '@/components/dashboard/ERPConnections'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useInventoryStore } from '@/store/inventoryStore'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'anomalies' | 'forecasts' | 'sync'>('overview')
  const { isConnected, lastMessage } = useWebSocket()
  const { updateInventory } = useInventoryStore()

  // Handle real-time WebSocket updates
  useEffect(() => {
    if (lastMessage) {
      updateInventory(lastMessage)
    }
  }, [lastMessage, updateInventory])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SupplySync AI</h1>
              <p className="text-sm text-gray-500 mt-1">B2B Inventory Truth Engine</p>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'overview', label: '📊 Overview' },
                { id: 'anomalies', label: '🚨 Anomaly Alerts' },
                { id: 'forecasts', label: '📈 Demand Forecasts' },
                { id: 'sync', label: '🔄 Sync Status' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* KPI Cards */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-sm font-medium text-gray-500">Total SKUs</h3>
                  <p className="text-3xl font-bold text-gray-900 mt-2">12,458</p>
                  <p className="text-sm text-green-600 mt-2">↑ 5.2% from last week</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-sm font-medium text-gray-500">Sync Accuracy</h3>
                  <p className="text-3xl font-bold text-gray-900 mt-2">99.2%</p>
                  <p className="text-sm text-green-600 mt-2">↑ 2.1% this month</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-sm font-medium text-gray-500">Active Anomalies</h3>
                  <p className="text-3xl font-bold text-gray-900 mt-2">7</p>
                  <p className="text-sm text-yellow-600 mt-2">3 critical, 4 medium</p>
                </div>
              </div>

              <InventoryOverview />
              <ERPConnections />
            </>
          )}

          {activeTab === 'anomalies' && <AnomalyAlerts />}
          {activeTab === 'forecasts' && <DemandForecasts />}
          {activeTab === 'sync' && <SyncStatus />}
        </div>
      </main>
    </div>
  )
}
