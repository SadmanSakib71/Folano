import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loginUser, registerUser } from '../api/auth'
import type { User } from '../types'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

interface AuthContextValue {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (phone: string, password: string) => Promise<void>
  register: (data: {
    name: string
    phone: string
    email?: string
    password: string
  }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function isUser(value: unknown): value is User {
  if (!value || typeof value !== 'object') {
    return false
  }

  const user = value as Record<string, unknown>

  return (
    typeof user.id === 'number' &&
    typeof user.name === 'string' &&
    typeof user.phone === 'string' &&
    (user.email === null || typeof user.email === 'string') &&
    typeof user.role === 'string'
  )
}

function persistSession(token: string, user: User) {
  window.localStorage.setItem(TOKEN_KEY, token)
  window.localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
}

function applyAuthResponse(data: { token?: unknown; user?: unknown }): User {
  if (typeof data.token !== 'string' || !data.token || !isUser(data.user)) {
    throw new Error('Invalid auth response')
  }

  persistSession(data.token, data.user)
  return data.user
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = window.localStorage.getItem(TOKEN_KEY)
    const rawUser = window.localStorage.getItem(USER_KEY)

    if (token && rawUser) {
      try {
        const parsed: unknown = JSON.parse(rawUser)

        if (isUser(parsed)) {
          setUser(parsed)
        } else {
          clearSession()
        }
      } catch {
        clearSession()
      }
    }

    setLoading(false)
  }, [])

  const login = useCallback(async (phone: string, password: string) => {
    const data = await loginUser({ phone, password })
    setUser(applyAuthResponse(data))
  }, [])

  const register = useCallback(
    async (data: {
      name: string
      phone: string
      email?: string
      password: string
    }) => {
      const response = await registerUser(data)
      setUser(applyAuthResponse(response))
    },
    [],
  )

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
