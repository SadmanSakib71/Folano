import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import AdminSidebar from './AdminSidebar'

export default function AdminLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-neutral-100 text-neutral-900"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 lg:hidden"
              aria-label="Open sidebar"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <h1 className="truncate text-base font-semibold text-[#2D5A3D]">
              অ্যাডমিন প্যানেল
            </h1>
          </div>
          <p className="max-w-[40%] truncate text-sm text-neutral-600">
            {user?.name}
          </p>
        </header>

        <main className="min-w-0 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
