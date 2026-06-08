'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import PageLayout from '@/components/PageLayout'
import { sortData } from '@/lib/sort'
import SortControls from '@/components/SortControls'
import type { SortOption } from '@/components/SortControls'
import { truncate } from '@/lib/format'
import { Plus, Search, Trash2 } from 'lucide-react'

const clientSortOptions: SortOption[] = [
  { label: 'Nombre', value: 'nombre', type: 'string' },
  { label: 'Fecha', value: 'createdAt', type: 'date' },
]

type Cliente = {
  id: string
  nombre: string
  telefono?: string | null
  email?: string | null
  notas?: string | null
  direccion?: string | null
  latitud?: number | null
  longitud?: number | null
  createdAt?: string
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [notas, setNotas] = useState('')
  const [direccion, setDireccion] = useState('')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetch('/api/clientes', { credentials: 'include' })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<Cliente[]> })
      .then((data) => setClientes(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, telefono: telefono || undefined, email: email || undefined, notas: notas || undefined, direccion: direccion || undefined }),
      })
      if (!res.ok) throw new Error(String(res.status))
      const c = await res.json() as Cliente
      setClientes((prev) => [c, ...prev])
      setNombre(''); setTelefono(''); setEmail(''); setNotas(''); setDireccion('')
      setShowForm(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este cliente?')) return
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error(String(res.status))
      setClientes((prev) => prev.filter((c) => c.id !== id))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const filtered = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const sortedClientes = useMemo(
    () => sortData(filtered, sortField, sortDir, clientSortOptions.find((o) => o.value === sortField)?.type ?? 'string'),
    [filtered, sortField, sortDir],
  )

  return (
    <PageLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Clientes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Plus size={16} />
          {showForm ? 'Cancelar' : 'Nuevo'}
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar clientes..."
          className="w-full pl-9 p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <SortControls
        options={clientSortOptions}
        field={sortField}
        direction={sortDir}
        onChange={(f, d) => { setSortField(f); setSortDir(d) }}
        itemCount={filtered.length}
      />

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 mb-5 space-y-3">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre *" required className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Teléfono" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Notas" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <button className="w-full py-2.5 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 transition focus:outline-none focus:ring-2 focus:ring-emerald-500">
            Guardar cliente
          </button>
        </form>
      )}

      {loading && <div className="text-gray-500 text-sm">Cargando clientes...</div>}
      {error && <div className="text-red-600 text-sm mb-4">Error: {error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {sortedClientes.map((c) => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
            <Link href={`/clientes/${c.id}`} className="flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
              <div className="font-medium text-gray-900 truncate">{c.nombre}</div>
              <div className="text-sm text-gray-600 truncate">
                {[c.email, c.telefono].filter(Boolean).join(' · ') || 'Sin contacto'}
              </div>
              {c.direccion && (
                <div className="text-xs text-gray-400 truncate mt-0.5">{truncate(c.direccion, 50)}</div>
              )}
            </Link>
            <button
              onClick={() => handleDelete(c.id)}
              className="flex-shrink-0 p-2 text-gray-500 hover:text-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg ml-2"
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {filtered.length === 0 && !loading && (
          <div className="text-gray-600 text-sm text-center py-8">No hay clientes</div>
        )}
      </div>
    </PageLayout>
  )
}
