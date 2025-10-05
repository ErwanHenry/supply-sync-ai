import { useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import toast from 'react-hot-toast'

interface UseWebSocketReturn {
  isConnected: boolean
  lastMessage: any
  sendMessage: (event: string, data: any) => void
}

/**
 * Custom hook for WebSocket real-time updates
 *
 * Features:
 * - Auto-reconnect on disconnect
 * - Error handling
 * - Connection status tracking
 * - Toast notifications for important events
 */
export function useWebSocket(): UseWebSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'

    // Initialize Socket.IO connection
    const socketInstance = io(wsUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('✅ WebSocket connected')
      setIsConnected(true)
      toast.success('Connected to real-time sync', { duration: 2000 })
    })

    socketInstance.on('disconnect', () => {
      console.log('❌ WebSocket disconnected')
      setIsConnected(false)
      toast.error('Disconnected from real-time sync', { duration: 3000 })
    })

    socketInstance.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      setIsConnected(false)
    })

    // Inventory update events
    socketInstance.on('inventory:update', (data) => {
      console.log('📦 Inventory update:', data)
      setLastMessage({ type: 'inventory:update', data })
    })

    // Anomaly alert events
    socketInstance.on('anomaly:detected', (data) => {
      console.log('🚨 Anomaly detected:', data)
      setLastMessage({ type: 'anomaly:detected', data })

      // Show toast notification based on severity
      if (data.severity === 'critical') {
        toast.error(`🚨 CRITICAL: ${data.anomaly_type}`, { duration: 10000 })
      } else if (data.severity === 'high') {
        toast.error(`⚠️ ${data.anomaly_type}`, { duration: 5000 })
      } else {
        toast(`⚠️ ${data.anomaly_type}`, { duration: 3000 })
      }
    })

    // Sync events
    socketInstance.on('sync:started', (data) => {
      console.log('🔄 Sync started:', data)
      setLastMessage({ type: 'sync:started', data })
      toast('🔄 Sync started', { duration: 2000 })
    })

    socketInstance.on('sync:completed', (data) => {
      console.log('✅ Sync completed:', data)
      setLastMessage({ type: 'sync:completed', data })
      toast.success(`✅ Sync completed: ${data.items_synced} items`, { duration: 3000 })
    })

    socketInstance.on('sync:error', (data) => {
      console.error('❌ Sync error:', data)
      setLastMessage({ type: 'sync:error', data })
      toast.error(`❌ Sync failed: ${data.error}`, { duration: 5000 })
    })

    setSocket(socketInstance)

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const sendMessage = useCallback((event: string, data: any) => {
    if (socket && isConnected) {
      socket.emit(event, data)
    } else {
      console.warn('Cannot send message: WebSocket not connected')
    }
  }, [socket, isConnected])

  return {
    isConnected,
    lastMessage,
    sendMessage,
  }
}
