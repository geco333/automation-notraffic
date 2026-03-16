import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'qa@test.com': {
    password: 'test1234',
    user: { id: '1', email: 'qa@test.com', name: 'QA Tester' },
  },
  'admin@traffic.local': {
    password: 'admin1234',
    user: { id: '2', email: 'admin@traffic.local', name: 'Traffic Admin' },
  },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem('traffic_auth_user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('traffic_auth_token'))

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 600))
    const entry = MOCK_USERS[email]
    if (!entry || entry.password !== password) return false
    const mockJwt = `mock_jwt_${entry.user.id}_${Date.now()}`
    setUser(entry.user)
    setToken(mockJwt)
    sessionStorage.setItem('traffic_auth_user', JSON.stringify(entry.user))
    sessionStorage.setItem('traffic_auth_token', mockJwt)
    return true
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    sessionStorage.removeItem('traffic_auth_user')
    sessionStorage.removeItem('traffic_auth_token')
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
