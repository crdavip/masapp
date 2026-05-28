'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import PageLayout from '@/components/PageLayout'
import { formatCOP } from '@/lib/format'
import SearchableSelect from '@/components/SearchableSelect'
import { ArrowLeft, Plus, X, User, Package } from 'lucide-react'

type Cliente = { id: string; nombre: string }
type Producto = { id: string; nombre: string; precioVenta: string; cantidadStock: number }
type LineItem = { productoId: string; nombre: string; cantidad: number; precioUnitario: number; subtotal: number }

export default function NuevaVentaPage() {
  const { status } = useSession()
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [clienteId, setClienteId] = useState('')
  const [notas, setNotas] = useState('')
  const [items, setItems] = useState<LineItem[]>([])
  const [productoValue, setProductoValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated') return
    Promise.all([
      fetch('/api/clientes', { credentials: 'include' }).then(r => r.json()) as Promise<Cliente[]>,
      fetch('/api/productos', { credentials: 'include' }).then(r => r.json()) as Promise<Producto[]>,
    ]).then(([c, p]) => { setClientes(c); setProductos(p) }).catch(() => {})
  }, [status])

  function addItem(productoId: string) {
    const prod = productos.find((p) => p.id === productoId)
    if (!prod) return
    if (prod.cantidadStock < 1) { setError('Producto sin stock'); return }
    setItems((prev) => {
      const existing = prev.find((i) => i.productoId === productoId)
      if (existing) {
        if (existing.cantidad >= prod.cantidadStock) { setError('Stock insuficiente'); return prev }
        return prev.map((i) => i.productoId === productoId ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precioUnitario } : i)
      }
      return [...prev, { productoId: prod.id, nombre: prod.nombre, cantidad: 1, precioUnitario: Number(prod.precioVenta), subtotal: Number(prod.precioVenta) }]
    })
    setError(null)
  }

  function removeItem(productoId: string) {
    setItems((prev) => prev.filter((i) => i.productoId !== productoId))
  }

  function updateCantidad(productoId: string, cantidad: number) {
    const prod = productos.find((p) => p.id === productoId)
    if (!prod || cantidad < 1 || cantidad > prod.cantidadStock) return
    setItems((prev) => prev.map((i) => i.productoId === productoId ? { ...i, cantidad, subtotal: cantidad * i.precioUnitario } : i))
  }

  const total = items.reduce((sum, i) => sum + i.subtotal, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clienteId || items.length === 0) { setError('Selecciona un cliente y al menos un producto'); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/ventas', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId, items: items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad, precioUnitario: i.precioUnitario })), notas: notas || undefined }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || String(res.status)) }
      const venta = await res.json()
      router.push(`/ventas/${venta.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  if (status !== 'authenticated') return null

  return (
    <PageLayout>
      <Link href="/ventas" className="inline-flex items-center gap-1 text-sm text-blue-700 hover:text-blue-900 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
        <ArrowLeft size={16} />
        Volver a ventas
      </Link>

      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-5">Nueva venta</h1>

      {error && <div className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
          <SearchableSelect
            options={clientes.map((c) => ({ value: c.id, label: c.nombre }))}
            value={clienteId}
            onChange={setClienteId}
            icon={User}
            placeholder="Buscá cliente por nombre..."
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
          <label className="block text-sm font-medium text-gray-700 mb-3">Productos</label>
          <div className="mb-4">
            <SearchableSelect
              options={productos.filter((p) => p.cantidadStock > 0).map((p) => ({
                value: p.id,
                label: `${p.nombre} — ${formatCOP(p.precioVenta)} (Stock: ${p.cantidadStock})`,
              }))}
              value={productoValue}
              onChange={(val) => {
                if (!val) return
                addItem(val)
                setProductoValue('')
              }}
              icon={Package}
              placeholder="Buscá producto por nombre..."
            />
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-4">No hay productos agregados</p>
          ) : (
            <div className="space-y-2">
              {items.map((i) => (
                <div key={i.productoId} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">{i.nombre}</div>
                    <div className="text-xs text-gray-600">{formatCOP(i.precioUnitario)} c/u</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" value={i.cantidad}
                      onChange={(e) => updateCantidad(i.productoId, Number(e.target.value))}
                      min="1" className="w-14 p-1.5 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-sm font-medium text-gray-900 w-20 text-right">{formatCOP(i.subtotal)}</span>
                    <button type="button" onClick={() => removeItem(i.productoId)} className="p-1.5 text-gray-500 hover:text-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-500 rounded" title="Eliminar">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="text-sm text-gray-600">Total</span>
                <span className="text-lg font-bold text-gray-900">{formatCOP(total)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Notas (opcional)</label>
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={2} />
        </div>

        <button
          disabled={saving || items.length === 0}
          className="w-full py-3 bg-emerald-700 text-white rounded-xl text-sm font-semibold hover:bg-emerald-800 transition focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando...' : `Crear venta — ${formatCOP(total)}`}
        </button>
      </form>
    </PageLayout>
  )
}
