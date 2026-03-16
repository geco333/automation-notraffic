export interface User {
  id: string
  email: string
  name: string
}

export interface TrafficSignal {
  id: string
  deviceId: string
  name: string
  status: 'online' | 'offline' | 'maintenance'
  phase: 'red' | 'yellow' | 'green'
  cycleSeconds: number
  lastUpdated: string
}

export interface Alert {
  id: string
  deviceId: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  timestamp: string
  acknowledged: boolean
}

export interface DeviceStatusUpdate {
  deviceId: string
  status: 'online' | 'offline' | 'maintenance'
  phase?: 'red' | 'yellow' | 'green'
  timestamp: string
}
