'use client'

export default function ERPConnections() {
  const connections = [
    { id: '1', name: 'SAP', status: 'connected', lastSync: '2 min ago', itemsCount: 1250 },
    { id: '2', name: 'Oracle', status: 'connected', lastSync: '5 min ago', itemsCount: 850 },
    { id: '3', name: 'Dynamics 365', status: 'error', lastSync: '1 hour ago', itemsCount: 0 },
    { id: '4', name: 'NetSuite', status: 'connected', lastSync: '10 min ago', itemsCount: 620 },
    { id: '5', name: 'Odoo', status: 'disconnected', lastSync: 'Never', itemsCount: 0 },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'disconnected':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return '🟢'
      case 'error':
        return '🔴'
      case 'disconnected':
        return '⚪'
      default:
        return '⚪'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">ERP Connections</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {connections.map((conn) => (
          <div key={conn.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getStatusIcon(conn.status)}</span>
                <h3 className="font-medium text-gray-900">{conn.name}</h3>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(conn.status)}`}>
                {conn.status}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Last Sync:</span>
                <span className="text-gray-900">{conn.lastSync}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Items:</span>
                <span className="text-gray-900">{conn.itemsCount.toLocaleString()}</span>
              </div>
            </div>

            <button className="w-full mt-4 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition">
              {conn.status === 'connected' ? 'Configure' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
