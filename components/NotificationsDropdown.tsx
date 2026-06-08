'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { formatCOP } from '@/lib/format'

interface Notificacion {
  ventaId: string
  clienteId: string
  clienteNombre: string
  total: number
  saldoPendiente: number
  ultimoMovimiento: string
  díasInactivo: number
  tipo: 'atencion' | 'vencido'
}

interface NotificacionesData {
  total: number
  atencion: Notificacion[]
  vencido: Notificacion[]
}

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<NotificacionesData | null>(null)
  const [error, setError] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    fetch('/api/notificaciones')
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((d: NotificacionesData) => setData(d))
      .catch(() => setError(true))
  }, [])

  const totalNotificaciones = data?.total ?? 0

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-1.5 rounded-lg hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Notificaciones"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell size={18} className="text-gray-500" />
        {totalNotificaciones > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4.5 h-4.5 text-[10px] font-bold text-white bg-red-600 rounded-full min-w-[18px] min-h-[18px] leading-none">
            {totalNotificaciones > 99 ? '99+' : totalNotificaciones}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Mobile overlay */}
          <div
            className="fixed inset-0 bg-black/40 z-40 sm:hidden"
            onClick={() => setOpen(false)}
          />

          <div
            className="z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-y-auto
              fixed inset-x-4 top-1/2 -translate-y-1/2 max-h-[80vh]
              sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:min-w-[360px] sm:max-h-[70vh] sm:inset-x-auto sm:translate-y-0"
          >
            <div className="flex items-center justify-between p-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
              <button
                onClick={() => setOpen(false)}
                className="sm:hidden p-1 text-gray-400 hover:text-gray-600"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-4 text-sm text-red-600">Error al cargar notificaciones</div>
            )}

            {!data && !error && (
              <div className="p-4 text-sm text-gray-400 animate-pulse">Cargando...</div>
            )}

            {data && totalNotificaciones === 0 && (
              <div className="p-4 text-sm text-gray-500">No hay notificaciones pendientes</div>
            )}

            {data && data.vencido.length > 0 && (
              <div className="border-b border-gray-100">
                <div className="px-3 pt-3 pb-1">
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                    Vencido ({data.vencido.length})
                  </p>
                </div>
                {data.vencido.map((n) => (
                  <Link
                    key={n.ventaId}
                    href={`/ventas/${n.ventaId}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-red-50 transition group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-red-700 transition">
                        {n.clienteNombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        {n.díasInactivo} días sin movimiento
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-red-700 whitespace-nowrap">
                      {formatCOP(n.saldoPendiente)}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {data && data.atencion.length > 0 && (
              <div>
                <div className="px-3 pt-3 pb-1">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                    Atención ({data.atencion.length})
                  </p>
                </div>
                {data.atencion.map((n) => (
                  <Link
                    key={n.ventaId}
                    href={`/ventas/${n.ventaId}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-amber-50 transition group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-amber-700 transition">
                        {n.clienteNombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        {n.díasInactivo} días sin movimiento
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-amber-700 whitespace-nowrap">
                      {formatCOP(n.saldoPendiente)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
