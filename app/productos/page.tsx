'use client'

import { useEffect, useState, useMemo } from 'react'
import PageLayout from '@/components/PageLayout'
import { formatCOP } from '@/lib/format'
import { sortData } from '@/lib/sort'
import SortControls from '@/components/SortControls'
import type { SortOption } from '@/components/SortControls'
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react'

type Producto = {
  id: string
  nombre: string
  precioVenta: string
  precioCompra?: string | null
  cantidadStock: number
  createdAt?: string
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')
  const [precioCompra, setPrecioCompra] = useState('')
  const [cantidadStock, setCantidadStock] = useState(0)
  const [editId, setEditId] = useState<string | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const [editPrecioVenta, setEditPrecioVenta] = useState('')
  const [editPrecioCompra, setEditPrecioCompra] = useState('')
  const [editStock, setEditStock] = useState(0)
  const [sortField, setSortField] = useState('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const sortOptions: SortOption[] = [
    { label: 'Nombre', value: 'nombre', type: 'string' },
    { label: 'Precio venta', value: 'precioVenta', type: 'number' },
    { label: 'Precio compra', value: 'precioCompra', type: 'number' },
    { label: 'Stock', value: 'cantidadStock', type: 'number' },
    { label: 'Fecha', value: 'createdAt', type: 'date' },
  ]

  const sortedProductos = useMemo(
    () => sortData(productos, sortField, sortDir, sortOptions.find((o) => o.value === sortField)?.type ?? 'string'),
    [productos, sortField, sortDir],
  )

  useEffect(() => {
    fetch('/api/productos', { credentials: 'include' })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<Producto[]> })
      .then((data) => setProductos(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const res = await fetch('/api/productos', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, precioVenta, precioCompra: precioCompra || undefined, cantidadStock }),
      })
      if (!res.ok) throw new Error(String(res.status))
      const p = await res.json() as Producto
      setProductos((prev) => [p, ...prev])
      setNombre(''); setPrecioVenta(''); setPrecioCompra(''); setCantidadStock(0)
      setShowForm(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  function startEdit(p: Producto) {
    setEditId(p.id)
    setEditNombre(p.nombre)
    setEditPrecioVenta(p.precioVenta)
    setEditPrecioCompra(p.precioCompra || '')
    setEditStock(p.cantidadStock)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editId) return
    setError(null)
    try {
      const res = await fetch(`/api/productos/${editId}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: editNombre, precioVenta: editPrecioVenta, precioCompra: editPrecioCompra || null, cantidadStock: editStock }),
      })
      if (!res.ok) throw new Error(String(res.status))
      const updated = await res.json() as Producto
      setProductos((prev) => prev.map((p) => p.id === editId ? updated : p))
      setEditId(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este producto?')) return
    try {
      const res = await fetch(`/api/productos/${id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error(String(res.status))
      setProductos((prev) => prev.filter((p) => p.id !== id))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <PageLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Productos</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Plus size={16} />
          {showForm ? 'Cancelar' : 'Nuevo'}
        </button>
      </div>

      <SortControls
        options={sortOptions}
        field={sortField}
        direction={sortDir}
        onChange={(f, d) => { setSortField(f); setSortDir(d) }}
        itemCount={productos.length}
      />

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 mb-5 space-y-3">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre *" required className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <div className="grid grid-cols-2 gap-2">
            <input value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} placeholder="Precio venta *" required className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <input value={precioCompra} onChange={(e) => setPrecioCompra(e.target.value)} placeholder="Precio compra" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <input value={cantidadStock} onChange={(e) => setCantidadStock(Number(e.target.value))} type="number" placeholder="Stock" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <button className="w-full py-2.5 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 transition focus:outline-none focus:ring-2 focus:ring-emerald-500">
            Crear producto
          </button>
        </form>
      )}

      {loading && <div className="text-gray-500 text-sm">Cargando productos...</div>}
      {error && <div className="text-red-600 text-sm mb-4">Error: {error}</div>}

      <div className="grid gap-3">
        {sortedProductos.map((p) => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            {editId === p.id ? (
              <form onSubmit={handleEdit} className="space-y-2">
                <input value={editNombre} onChange={(e) => setEditNombre(e.target.value)} placeholder="Nombre" required className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input value={editPrecioVenta} onChange={(e) => setEditPrecioVenta(e.target.value)} placeholder="P. venta" required className="p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <input value={editPrecioCompra} onChange={(e) => setEditPrecioCompra(e.target.value)} placeholder="P. compra" className="p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <input value={editStock} onChange={(e) => setEditStock(Number(e.target.value))} type="number" placeholder="Stock" className="p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1 px-4 py-1.5 bg-emerald-700 text-white rounded text-sm font-medium hover:bg-emerald-800 transition focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <Save size={14} />
                    Guardar
                  </button>
                  <button type="button" onClick={() => setEditId(null)} className="flex items-center gap-1 px-4 py-1.5 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300 transition focus:outline-none focus:ring-2 focus:ring-gray-500">
                    <X size={14} />
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 truncate">{p.nombre}</div>
                  <div className="text-sm text-gray-600 flex flex-wrap items-baseline gap-x-1">
                    <span>Venta: <span className="font-medium">{formatCOP(p.precioVenta)}</span></span>
                    {p.precioCompra && <span>· Compra: <span className="font-medium">{formatCOP(p.precioCompra)}</span></span>}
                    <span className="whitespace-nowrap">· Stock: <span className={`font-medium ${p.cantidadStock <= 5 ? 'text-red-600' : 'text-gray-800'}`}>{p.cantidadStock}</span></span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(p)} className="p-2 text-gray-500 hover:text-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg" title="Editar">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-500 hover:text-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg" title="Eliminar">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {productos.length === 0 && !loading && (
          <div className="text-gray-600 text-sm text-center py-8">No hay productos</div>
        )}
      </div>
    </PageLayout>
  )
}
