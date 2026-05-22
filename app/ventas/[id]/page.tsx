'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import PageLayout from '@/components/PageLayout'
import StatusBadge from '@/components/StatusBadge'
import { formatCOP } from '@/lib/format'
import { ArrowLeft } from 'lucide-react'

type VentaDetalle = {
  id: string
  clienteId: string
  cliente: { id: string; nombre: string }
  total: string
  saldoPendiente: string
  estado: string
  fecha: string
  notas?: string | null
  items: {
    id: string
    productoId: string
    producto: { id: string; nombre: string }
    cantidad: number
    precioUnitario: string
    subtotal: string
  }[]
  abonos: {
    id: string
    monto: string
    metodoPago?: string | null
    fecha: string
    notas?: string | null
  }[]
}

export default function VentaDetallePage() {
  const params = useParams()
  const [venta, setVenta] = useState<VentaDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [abonoMonto, setAbonoMonto] = useState('')
  const [abonoMetodo, setAbonoMetodo] = useState('efectivo')
  const [abonoNotas, setAbonoNotas] = useState('')
  const [savingAbono, setSavingAbono] = useState(false)

  const load = useCallback(() => {
    fetch(`/api/ventas/${params.id}`, { credentials: 'include' })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<VentaDetalle> })
      .then((data) => setVenta(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [params.id])

  useEffect(() => { load() }, [load])

  async function handleAbono(e: React.FormEvent) {
    e.preventDefault()
    if (!venta) return
    const montoNum = Number(abonoMonto)
    if (montoNum <= 0) { setError('El monto debe ser mayor a 0'); return }
    if (montoNum > Number(venta.saldoPendiente)) { setError('El abono no puede exceder el saldo pendiente'); return }
    setSavingAbono(true)
    setError(null)
    try {
      const res = await fetch('/api/abonos', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ventaId: venta.id, monto: abonoMonto, metodoPago: abonoMetodo, notas: abonoNotas || undefined }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || String(res.status)) }
      setAbonoMonto(''); setAbonoMetodo('efectivo'); setAbonoNotas('')
      load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSavingAbono(false)
    }
  }

  if (loading) return <div className="p-6 text-gray-500">Cargando...</div>
  if (!venta) return <div className="p-6 text-red-600">Venta no encontrada</div>

  return (
    <PageLayout>
      <Link href="/ventas" className="inline-flex items-center gap-1 text-sm text-blue-700 hover:text-blue-900 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
        <ArrowLeft size={16} />
        Volver a ventas
      </Link>

      {error && <div className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Venta</h1>
          <StatusBadge estado={venta.estado} />
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          <p>Cliente: <Link href={`/clientes/${venta.clienteId}`} className="text-blue-700 hover:text-blue-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">{venta.cliente?.nombre || 'Eliminado'}</Link></p>
          <p>Fecha: {new Date(venta.fecha).toLocaleString('es-CO')}</p>
          {venta.notas && <p>Notas: {venta.notas}</p>}
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-base sm:text-xl font-bold text-gray-900">{formatCOP(venta.total)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Pagado</p>
            <p className="text-base sm:text-xl font-bold text-emerald-700">
              {formatCOP(Number(venta.total) - Number(venta.saldoPendiente))}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Saldo</p>
            <p className="text-base sm:text-xl font-bold text-amber-700">{formatCOP(venta.saldoPendiente)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Productos</h2>
          <div className="space-y-2">
            {venta.items.map((i) => (
              <div key={i.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm text-gray-900 truncate">{i.producto?.nombre || 'Producto eliminado'}</div>
                  <div className="text-xs text-gray-600">{i.cantidad} x {formatCOP(i.precioUnitario)}</div>
                </div>
                <span className="font-medium text-sm text-gray-900 ml-2">{formatCOP(i.subtotal)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Abonos</h2>
            {venta.abonos.length > 0 && (
              <span className="text-xs text-gray-500">{venta.abonos.length} registro{venta.abonos.length > 1 ? 's' : ''}</span>
            )}
          </div>

          {venta.abonos.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-4">No hay abonos registrados</p>
          ) : (
            <div className="space-y-2 mb-4">
              {venta.abonos.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{formatCOP(a.monto)}</div>
                    <div className="text-xs text-gray-600">
                      {new Date(a.fecha).toLocaleString('es-CO')}
                      {a.metodoPago && <> · {a.metodoPago}</>}
                    </div>
                    {a.notas && <div className="text-xs text-gray-500">{a.notas}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {venta.estado !== 'pagada' && (
            <form onSubmit={handleAbono} className="space-y-2 border-t border-gray-200 pt-3">
              <h3 className="text-sm font-medium text-gray-700">Registrar abono</h3>
              <input value={abonoMonto} onChange={(e) => setAbonoMonto(e.target.value)} type="number" step="1" placeholder="Monto *" required className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <select value={abonoMetodo} onChange={(e) => setAbonoMetodo(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="otro">Otro</option>
              </select>
              <input value={abonoNotas} onChange={(e) => setAbonoNotas(e.target.value)} placeholder="Notas" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <button
                disabled={savingAbono}
                className="w-full py-2.5 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 transition focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingAbono ? 'Guardando...' : 'Registrar abono'}
              </button>
            </form>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
