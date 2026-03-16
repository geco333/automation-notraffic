import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchSignals } from '@/services/api'
import type { TrafficSignal } from '@/types'

export function SignalsPage() {
  const [signals, setSignals] = useState<TrafficSignal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSignals()
      .then((res) => setSignals(Array.isArray(res) ? (res as TrafficSignal[]) : []))
      .catch(() => setSignals(MOCK_SIGNALS))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="signals-page" data-testid="signals-list-page">
      <h1>Traffic signals</h1>
      {loading ? (
        <p data-testid="signals-loading">Loading…</p>
      ) : (
        <ul className="signal-list">
          {signals.map((s) => (
            <li key={s.id}>
              <Link to={`/signals/${s.id}`} data-testid={`signal-row-${s.id}`}>
                {s.name} — {s.deviceId} — {s.status}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const MOCK_SIGNALS: TrafficSignal[] = [
  { id: '1', deviceId: 'DEV-001', name: 'Main & 5th', status: 'online', phase: 'green', cycleSeconds: 90, lastUpdated: new Date().toISOString() },
  { id: '2', deviceId: 'DEV-002', name: 'Oak & 3rd', status: 'online', phase: 'red', cycleSeconds: 120, lastUpdated: new Date().toISOString() },
]
