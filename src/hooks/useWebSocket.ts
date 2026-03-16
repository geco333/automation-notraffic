import { useEffect, useState, useCallback } from 'react'
import type { DeviceStatusUpdate } from '@/types'

const WS_BASE = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`

export function useWebSocket(path: string) {
  const [updates, setUpdates] = useState<DeviceStatusUpdate[]>([])
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<DeviceStatusUpdate | null>(null)

  const addUpdate = useCallback((update: DeviceStatusUpdate) => {
    setLastMessage(update)
    setUpdates((prev) => [update, ...prev].slice(0, 50))
  }, [])

  useEffect(() => {
    const token = sessionStorage.getItem('traffic_auth_token')
    const url = `${WS_BASE}${path}${token ? `?token=${encodeURIComponent(token)}` : ''}`
    const ws = new WebSocket(url)

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as DeviceStatusUpdate
        if (data.deviceId && data.timestamp) addUpdate(data)
      } catch {
        // ignore non-JSON
      }
    }

    return () => {
      ws.close()
    }
  }, [path, addUpdate])

  return { updates, connected, lastMessage }
}
