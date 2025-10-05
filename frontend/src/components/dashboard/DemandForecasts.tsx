'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts'
import { apiClient } from '@/lib/apiClient'
import { format, parseISO } from 'date-fns'

interface Forecast {
  date: string
  quantity_predicted: number
  lower_bound: number
  upper_bound: number
}

interface ForecastData {
  forecasts: Forecast[]
  model_type: string
  accuracy_metrics: {
    mape: number
    rmse: number
    mae: number
  }
  confidence: number
}

export default function DemandForecasts() {
  const [loading, setLoading] = useState(true)
  const [forecastData, setForecastData] = useState<ForecastData | null>(null)
  const [selectedSku, setSelectedSku] = useState('SKU001')
  const [horizon, setHorizon] = useState(7)

  useEffect(() => {
    loadForecast()
  }, [selectedSku, horizon])

  const loadForecast = async () => {
    setLoading(true)
    try {
      // Mock data for now - will be replaced with actual API call
      const mockData: ForecastData = {
        forecasts: Array.from({ length: horizon }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() + i + 1)
          const baseQty = 100 + Math.random() * 20
          return {
            date: date.toISOString().split('T')[0],
            quantity_predicted: Math.round(baseQty),
            lower_bound: Math.round(baseQty * 0.9),
            upper_bound: Math.round(baseQty * 1.1),
          }
        }),
        model_type: 'prophet',
        accuracy_metrics: {
          mape: 8.5,
          rmse: 12.3,
          mae: 9.8,
        },
        confidence: 0.92,
      }

      setForecastData(mockData)
    } catch (error) {
      console.error('Failed to load forecast:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !forecastData) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  // Prepare chart data
  const chartData = forecastData.forecasts.map((f) => ({
    date: format(parseISO(f.date), 'MMM dd'),
    predicted: f.quantity_predicted,
    lowerBound: f.lower_bound,
    upperBound: f.upper_bound,
  }))

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Demand Forecast</h2>

          <div className="flex items-center gap-4">
            {/* SKU Selector */}
            <div>
              <label className="text-sm text-gray-600 mr-2">SKU:</label>
              <select
                value={selectedSku}
                onChange={(e) => setSelectedSku(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SKU001">SKU001</option>
                <option value="SKU002">SKU002</option>
                <option value="SKU003">SKU003</option>
              </select>
            </div>

            {/* Horizon Selector */}
            <div>
              <label className="text-sm text-gray-600 mr-2">Forecast:</label>
              <select
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Model</p>
            <p className="text-lg font-bold text-gray-900 capitalize">{forecastData.model_type}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Confidence</p>
            <p className="text-lg font-bold text-gray-900">{(forecastData.confidence * 100).toFixed(0)}%</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">MAPE</p>
            <p className="text-lg font-bold text-gray-900">{forecastData.accuracy_metrics.mape.toFixed(1)}%</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">MAE</p>
            <p className="text-lg font-bold text-gray-900">{forecastData.accuracy_metrics.mae.toFixed(1)}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} label={{ value: 'Quantity', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px',
                }}
              />
              <Legend />

              {/* Confidence interval (shaded area) */}
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="none"
                fill="#93c5fd"
                fillOpacity={0.2}
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                stroke="none"
                fill="#93c5fd"
                fillOpacity={0.2}
              />

              {/* Predicted line */}
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                name="Predicted Demand"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Forecast Table */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Forecast Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Predicted</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lower Bound</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Upper Bound</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence Range</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {forecastData.forecasts.slice(0, 7).map((forecast) => (
                  <tr key={forecast.date} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{format(parseISO(forecast.date), 'PP')}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{forecast.quantity_predicted}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{forecast.lower_bound}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{forecast.upper_bound}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      ±{((forecast.upper_bound - forecast.lower_bound) / 2).toFixed(0)} ({(((forecast.upper_bound - forecast.lower_bound) / (2 * forecast.quantity_predicted)) * 100).toFixed(0)}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
