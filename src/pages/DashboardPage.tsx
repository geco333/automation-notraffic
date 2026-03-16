import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useWebSocket } from '@/hooks/useWebSocket'
import { fetchSignals, fetchAlerts } from '@/services/api'
import type { TrafficSignal, Alert } from '@/types'
import mockData from '@/mocks/dashboard.json'
import { DashboardMap } from '@/components/DashboardMap'

export function DashboardPage() {
  const { user } = useAuth()
  const { lastMessage, connected } = useWebSocket('/device-status/')
  const [signals, setSignals] = useState<TrafficSignal[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [signalsRes, alertsRes] = await Promise.all([
          fetchSignals() as Promise<TrafficSignal[]>,
          fetchAlerts() as Promise<Alert[]>,
        ])
        if (!cancelled) {
          setSignals(Array.isArray(signalsRes) ? signalsRes : [])
          setAlerts(Array.isArray(alertsRes) ? alertsRes : [])
        }
      } catch (e) {
        if (!cancelled) {
          setSignals((mockData.signals as TrafficSignal[]) ?? [])
          setAlerts((mockData.alerts as Alert[]) ?? [])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [lastMessage])

  return (
    <div className="dashboard" data-testid="dashboard-page">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="header-meta">
          <span className="user" data-testid="dashboard-user">{user?.name}</span>
          <span className={`ws-status ${connected ? 'connected' : 'disconnected'}`} data-testid="ws-status">
            WebSocket {connected ? '●' : '○'}
          </span>
        </div>
      </header>
      {error && <p className="banner error" role="alert">{error}</p>}
      {lastMessage && (
        <p className="banner info" data-testid="realtime-update" role="status">
          Real-time: device {lastMessage.deviceId} — {lastMessage.status} {lastMessage.phase && `(${lastMessage.phase})`}
        </p>
      )}
      <section className="dashboard-map-section" aria-label="Map">
        <DashboardMap />
      </section>
      {loading ? (
        <p data-testid="dashboard-loading">Loading…</p>
      ) : (
        <>
          <section className="signals-preview">
            <h2>Traffic signals</h2>
            <ul className="signal-list">
              {signals.slice(0, 5).map((s) => (
                <li key={s.id}>
                  <Link to={`/signals/${s.id}`} data-testid={`signal-link-${s.id}`}>
                    {s.name} — {s.status} ({s.phase})
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="/signals" className="link">View all signals</Link>
          </section>
          <section className="alerts-preview">
            <h2>Recent alerts</h2>
            <ul className="alert-list" data-testid="alert-list">
              {alerts.slice(0, 5).map((a) => (
                <li key={a.id} className={`severity-${a.severity}`} data-testid={`alert-${a.id}`}>
                  {a.message} <small>{a.timestamp}</small>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
