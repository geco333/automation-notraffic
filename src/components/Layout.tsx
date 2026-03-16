import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout">
      <nav className="main-nav" data-testid="main-nav">
        <Link to="/dashboard" data-testid="nav-dashboard">Dashboard</Link>
        <Link to="/signals" data-testid="nav-signals">Signals</Link>
        <span className="nav-user">{user?.name}</span>
        <button type="button" onClick={handleLogout} data-testid="nav-logout">Log out</button>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
