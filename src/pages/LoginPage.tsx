import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const ok = await login(email, password)
    setLoading(false)
    if (ok) navigate(from, { replace: true })
    else setError('Invalid email or password. Try qa@test.com / test1234')
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img
          src="https://notraffic-public.s3.us-west-1.amazonaws.com/nt-assets/logo-white.png"
          alt="NoTraffic"
          className="login-logo"
        />
        <h1>Traffic Management Platform</h1>
        <p className="subtitle">Sign in (mock Auth0)</p>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              data-testid="login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              data-testid="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit" data-testid="login-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="hint">Demo: qa@test.com / test1234</p>
      </div>
    </div>
  )
}
