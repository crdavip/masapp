'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import { LogOut, ChevronDown } from 'lucide-react'

export default function UserDropdown() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const email = session?.user?.email ?? ''
  const initial = email.charAt(0).toUpperCase() || '?'

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Menú de usuario"
      >
        <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
          {initial}
        </div>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform hidden sm:block ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 min-w-[220px] z-50 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{email}</p>
              <p className="text-xs text-gray-500">Usuario</p>
            </div>
          </div>

          <hr className="border-gray-200" />

          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 w-full text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg px-3 py-2 font-medium transition"
          >
            <LogOut size={16} />
            Salir
          </button>
        </div>
      )}
    </div>
  )
}
