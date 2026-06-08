'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Users, Package, Receipt, BarChart3 } from 'lucide-react'
import UserDropdown from './UserDropdown'

const links = [
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/productos', label: 'Productos', icon: Package },
  { href: '/ventas', label: 'Ventas', icon: Receipt },
  { href: '/analisis', label: 'Análisis', icon: BarChart3 },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-2.5 sm:py-3 w-full flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="text-base sm:text-lg font-bold text-gray-900 hover:text-gray-700 transition">Masa</Link>
          <nav className="hidden sm:flex items-center gap-1">
            {links.map((l) => {
              const Icon = l.icon
              const active = pathname.startsWith(l.href)
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon size={16} />
                  {l.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="p-1.5 rounded-lg hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Notificaciones"
          >
            <Bell size={18} className="text-gray-500" />
          </button>
          <UserDropdown />
        </div>
      </div>
    </header>
  )
}
