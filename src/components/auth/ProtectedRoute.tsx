import { ReactNode, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const location = useLocation()

  useEffect(() => {
    let mounted = true

    async function checkAuth() {
      const { data } = await supabase.auth.getSession()

      if (!mounted) return

      setIsAuthenticated(!!data.session)
      setLoading(false)
    }

    checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setIsAuthenticated(!!session)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
      supabase.auth.signOut()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-2">
          <h1 className="text-lg font-semibold">Verificando acesso...</h1>
          <p className="text-sm text-muted-foreground">Aguarde um instante.</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}