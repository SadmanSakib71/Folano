import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Layers,
  ClipboardList,
  CalendarClock,
  ExternalLink,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Layers },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/preorder-batches', label: 'Pre-order Batches', icon: CalendarClock },
] as const

interface AdminSidebarProps {
  open: boolean
  onClose: () => void
}

function navClassName(isActive: boolean) {
  return [
    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-white/15 text-white shadow-[inset_3px_0_0_0_#E8912D]'
      : 'text-white/75 hover:bg-white/10 hover:text-white',
  ].join(' ')
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#2D5A3D] text-white',
          'transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
        ].join(' ')}
      >
        <div className="border-b border-white/15 px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-white/60">
            Folana
          </p>
          <p className="mt-1 text-lg font-semibold">Admin</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                onClick={onClose}
                className={({ isActive }) => navClassName(isActive)}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-auto border-t border-white/15 px-3 py-4 space-y-1">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            <span>সাইট দেখুন</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            <span>লগআউট</span>
          </button>
        </div>
      </aside>
    </>
  )
}
