import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminRoute() {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-neutral-100"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <p className="text-sm text-neutral-500">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
