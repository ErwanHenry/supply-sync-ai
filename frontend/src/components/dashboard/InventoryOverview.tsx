'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { apiClient } from '@/lib/apiClient'

export default function InventoryOverview() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalValue: 0,
    totalItems: 0,
    categories: [] as { name: string; count: number; value: number }[],
  })

  useEffect(() => {
    loadInventoryStats()
  }, [])

  const loadInventoryStats = async () => {
    try {
      // Mock data - will be replaced with API call
      const mockStats = {
        totalValue: 2458000,
        totalItems: 12458,
        categories: [
          { name: 'Electronics', count: 3200, value: 850000 },
          { name: 'Clothing', count: 4500, value: 620000 },
          { name: 'Food', count: 2800, value: 380000 },
          { name: 'Tools', count: 1958, value: 608000 },
        ],
      }
      setStats(mockStats)
    } catch (error) {
      console.error('Failed to load inventory stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Inventory Overview</h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Value</p>
          <p className="text-2xl font-bold text-gray-900">
            €{(stats.totalValue / 1000000).toFixed(2)}M
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Items</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalItems.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Category Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.categories}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'value') return [`€${(value / 1000).toFixed(0)}K`, 'Value']
                return [value.toLocaleString(), 'Count']
              }}
            />
            <Legend />
            <Bar dataKey="count" fill="#3b82f6" name="Item Count" />
            <Bar dataKey="value" fill="#10b981" name="Total Value (€)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
