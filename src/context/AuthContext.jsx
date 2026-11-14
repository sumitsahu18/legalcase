import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)
const KEY = 'legalcase_user'

// Abhi demo login hai — backend banne ke baad API call yahan lagegi
// eslint-disable-next-line react-refresh/only-export-components
export const DEMO_USER = { username: 'admin', password: 'admin123' }

function readUser() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser)

  const login = (username, password) => {
    if (username.trim() === DEMO_USER.username && password === DEMO_USER.password) {
      const u = { username: username.trim(), name: 'Anupam Maity', loginAt: Date.now() }
      try { localStorage.setItem(KEY, JSON.stringify(u)) } catch { /* ignore */ }
      setUser(u)
      return { ok: true }
    }
    return { ok: false, message: 'Invalid username or password' }
  }

  const logout = () => {
    try { localStorage.removeItem(KEY) } catch { /* ignore */ }
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
