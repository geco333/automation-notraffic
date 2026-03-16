const API_BASE = '/api'

function getAuthHeaders(): HeadersInit {
  const token = sessionStorage.getItem('traffic_auth_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function fetchSignals(): Promise<unknown[]> {
  const res = await fetch(`${API_BASE}/signals/`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchSignal(id: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}/signals/${id}/`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function updateSignal(id: string, body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${API_BASE}/signals/${id}/`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchAlerts(): Promise<unknown[]> {
  const res = await fetch(`${API_BASE}/alerts/`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function acknowledgeAlert(id: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}/alerts/${id}/acknowledge/`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/** Near-Miss Events by leg: HTTP request so you can see the data in the Network tab (/data is not proxied to backend) */
export async function fetchNearMissByLeg(
  signalId: string
): Promise<import('@/services/firestore').NearMissByLegData | null> {
  const res = await fetch(`/data/near-miss.json?signalId=${signalId}`)
  if (!res.ok) return null
  return res.json()
}
