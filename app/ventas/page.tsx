'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PageLayout from '@/components/PageLayout'
import StatusBadge from '@/components/StatusBadge'
import { formatCOP } from '@/lib/format'
import { Plus, Search } from 'lucide-react'

type Venta = {
  id: string
  clienteId: string
  cliente: { id: string; nombre: string }
  total: string
  saldoPendiente: string
  estado: string
  fecha: string
  notas?: string | null
}

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/ventas', { credentials: 'include' })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<Venta[]> })
      .then((data) => setVentas(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = ventas.filter((v) =>
    v.cliente?.nombre?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PageLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Ventas</h1>
        <Link
          href="/ventas/nueva"
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Plus size={16} />
          Nueva
        </Link>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente..."
          className="w-full pl-9 p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {loading && <div className="text-gray-500 text-sm">Cargando ventas...</div>}
      {error && <div className="text-red-600 text-sm mb-4">Error: {error}</div>}

      <div className="grid gap-3">
        {filtered.map((v) => (
          <Link
            key={v.id}
            href={`/ventas/${v.id}`}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 block hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium text-gray-900 truncate">{v.cliente?.nombre || 'Cliente eliminado'}</div>
              <span className="font-semibold text-gray-900 ml-2">{formatCOP(v.total)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <StatusBadge estado={v.estado} />
                <span>{new Date(v.fecha).toLocaleDateString('es-CO')}</span>
              </div>
              <span className="text-gray-600">Saldo: {formatCOP(v.saldoPendiente)}</span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && !loading && (
          <div className="text-gray-600 text-sm text-center py-8">No hay ventas</div>
        )}
      </div>
    </PageLayout>
  )
}
