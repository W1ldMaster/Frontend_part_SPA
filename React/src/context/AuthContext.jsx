import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { usersApi, authApi } from '../api/endpoints'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(token))

  const loadUser = useCallback(async () => {
    if (!localStorage.getItem('token')) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const { data } = await usersApi.me()
      setUser(data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser, token])

  useEffect(() => {
    const onLogout = () => {
      setToken(null)
      setUser(null)
    }
    window.addEventListener('auth:logout', onLogout)
    return () => window.removeEventListener('auth:logout', onLogout)
  }, [])

  const login = async (username, password) => {
    const data = await authApi.login(username, password)
    const access = data.access_token || data.access
    localStorage.setItem('token', access)
    setToken(access)
  }

  const loginWithToken = (raw) => {
    localStorage.setItem('token', raw)
    setToken(raw)
  }

  // 👇 ВОТ ЭТО ЧАСТО ЗАБЫВАЮТ
  const register = async (email, password, username) => {
    await authApi.register({ email, password, username })
    // авто-логин после регистрации
    await login(username || email, password)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        loginWithToken,
        register,   // 👈 ОБЯЗАТЕЛЬНО в value
        logout,
        reload: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}