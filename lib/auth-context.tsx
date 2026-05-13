'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from './supabase'

export interface StaffUser {
  staff_id: string; display_name: string; email: string
  department: string | null; role: string; is_admin: boolean; is_active: boolean
}
interface Ctx { user: StaffUser | null; loading: boolean; login: (e: string, p: string) => Promise<string | null>; logout: () => void }
const AuthCtx = createContext<Ctx | null>(null)
const KEY = 'bts_staff'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    try { const s = localStorage.getItem(KEY); if (s) setUser(JSON.parse(s)) } catch {}
    setLoading(false)
  }, [])
  const login = async (email: string, password: string): Promise<string | null> => {
    const { data, error } = await supabase.rpc('staff_login', { p_email: email.trim().toLowerCase(), p_password: password })
    if (error) return error.message
    if (!data?.length) return 'Email หรือรหัสผ่านไม่ถูกต้อง'
    setUser(data[0]); localStorage.setItem(KEY, JSON.stringify(data[0])); return null
  }
  const logout = () => { setUser(null); localStorage.removeItem(KEY) }
  return <AuthCtx.Provider value={{ user, loading, login, logout }}>{children}</AuthCtx.Provider>
}
export const useAuth = () => { const c = useContext(AuthCtx); if (!c) throw new Error('No AuthProvider'); return c }
