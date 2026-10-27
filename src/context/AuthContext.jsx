import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  // public.users 의 내 정보 (id, name) — 어떤 로그인 계정의 정보인지 함께 보관
  const [profileState, setProfileState] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const authId = session?.user?.id
  // 로그아웃하거나 계정이 바뀌면 이전 프로필은 자동으로 무시됨
  const profile = profileState?.authId === authId ? profileState.data : null

  useEffect(() => {
    if (!authId) return
    supabase
      .from('users')
      .select('id, name')
      .eq('auth_id', authId)
      .single()
      .then(({ data }) => setProfileState({ authId, data }))
  }, [authId])

  const value = {
    user: session?.user ?? null,
    profile,
    loading,
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
