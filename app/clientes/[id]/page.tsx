'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import PageLayout from '@/components/PageLayout'
import StatusBadge from '@/components/StatusBadge'
import { formatCOP } from '@/lib/format'
import { Pencil, DollarSign, ArrowLeft, Save, X } from 'lucide-react'

const MapaUbicacion = dynamic(() => import('@/components/MapaUbicacion'), { ssr: false })

type Cliente = {
  id: string; nombre: string; telefono?: string | null; email?: string | null; notas?: string | null
  direccion?: string | null; latitud?: number | null; longitud?: number | null
}

type Venta = {
  id: string; total: string; saldoPendiente: string; estado: string; fecha: string; notas?: string | null
  items: { id: string; productoId: string; cantidad: number; precioUnitario: string; subtotal: string }[]
  abonos: { id: string; monto: string; metodoPago?: string | null; fecha: string; notas?: string | null }[]
}

export default function ClienteDetallePage() {
  const params = useParams()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editNombre, setEditNombre] = useState('')
  const [editTelefono, setEditTelefono] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editNotas, setEditNotas] = useState('')
  const [editDireccion, setEditDireccion] = useState('')
  const [editLatitud, setEditLatitud] = useState<number | null>(null)
  const [editLongitud, setEditLongitud] = useState<number | null>(null)
  const [abonoVentaId, setAbonoVentaId] = useState<string | null>(null)
  const [abonoMonto, setAbonoMonto] = useState('')
  const [abonoMetodo, setAbonoMetodo] = useState('efectivo')
  const [abonoNotas, setAbonoNotas] = useState('')

  useEffect(() => {
    fetch(`/api/clientes/${params.id}`, { credentials: 'include' })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<{ cliente: Cliente; ventas: Venta[] }> })
      .then((data) => {
        setCliente(data.cliente); setVentas(data.ventas)
        setEditNombre(data.cliente.nombre); setEditTelefono(data.cliente.telefono || '')
        setEditEmail(data.cliente.email || ''); setEditNotas(data.cliente.notas || '')
        setEditDireccion(data.cliente.direccion || ''); setEditLatitud(data.cliente.latitud ?? null); setEditLongitud(data.cliente.longitud ?? null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [params.id])

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch(`/api/clientes/${params.id}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: editNombre, telefono: editTelefono || null, email: editEmail || null, notas: editNotas || null, direccion: editDireccion || null, latitud: editLatitud ?? null, longitud: editLongitud ?? null }),
      })
      if (!res.ok) throw new Error(String(res.status))
      const updated = await res.json() as Cliente
      setCliente(updated)
      setEditMode(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleAbono(e: React.FormEvent) {
    e.preventDefault()
    if (!abonoVentaId) return
    try {
      const res = await fetch('/api/abonos', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ventaId: abonoVentaId, monto: abonoMonto, metodoPago: abonoMetodo, notas: abonoNotas || undefined }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setAbonoVentaId(null); setAbonoMonto(''); setAbonoMetodo('efectivo'); setAbonoNotas('')
      const r = await fetch(`/api/clientes/${params.id}`, { credentials: 'include' })
      const data = await r.json() as { cliente: Cliente; ventas: Venta[] }
      setCliente(data.cliente); setVentas(data.ventas)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  if (loading) return <div className="p-6 text-gray-500">Cargando...</div>
  if (!cliente) return <div className="p-6 text-red-600">Cliente no encontrado</div>

  const totalPendiente = ventas.reduce((sum, v) => sum + Number(v.saldoPendiente), 0)

  return (
    <PageLayout>
      <Link href="/clientes" className="inline-flex items-center gap-1 text-sm text-blue-700 hover:text-blue-900 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
        <ArrowLeft size={16} />
        Volver a clientes
      </Link>

      {error && <div className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>}

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">{cliente.nombre}</h1>
        <button
          onClick={() => setEditMode(!editMode)}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          {editMode ? <X size={16} /> : <Pencil size={16} />}
          {editMode ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      {editMode ? (
        <form onSubmit={handleEdit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 mb-5 space-y-3">
          <input value={editNombre} onChange={(e) => setEditNombre(e.target.value)} placeholder="Nombre" required className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <input value={editTelefono} onChange={(e) => setEditTelefono(e.target.value)} placeholder="Teléfono" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <input value={editDireccion} onChange={(e) => setEditDireccion(e.target.value)} placeholder="Dirección" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <MapaUbicacion
            latitud={editLatitud}
            longitud={editLongitud}
            direccion={editDireccion}
            onLocationChange={(lat, lng, dir) => {
              setEditLatitud(lat)
              setEditLongitud(lng)
              if (dir) setEditDireccion(dir)
            }}
          />
          <textarea value={editNotas} onChange={(e) => setEditNotas(e.target.value)} placeholder="Notas" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <button className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 transition focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <Save size={16} />
            Guardar cambios
          </button>
        </form>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 mb-5 text-sm text-gray-700 space-y-1">
          {cliente.email && <p><span className="text-gray-500">Email:</span> {cliente.email}</p>}
          {cliente.telefono && <p><span className="text-gray-500">Teléfono:</span> {cliente.telefono}</p>}
          {cliente.notas && <p><span className="text-gray-500">Notas:</span> {cliente.notas}</p>}
          {!cliente.email && !cliente.telefono && !cliente.notas && <p className="text-gray-500">Sin información adicional</p>}
          {cliente.direccion && <p><span className="text-gray-500">Dirección:</span> {cliente.direccion}</p>}
        </div>
      )}

      {cliente.latitud != null && cliente.longitud != null && !editMode && (
        <div className="mb-5">
          <MapaUbicacion
            latitud={cliente.latitud}
            longitud={cliente.longitud}
            direccion={cliente.direccion}
            readonly
          />
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 mb-6 flex items-center gap-3">
        <DollarSign size={22} className="text-emerald-600" />
        <div>
          <p className="text-xs sm:text-sm text-gray-500">Saldo total pendiente</p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-700">{formatCOP(totalPendiente)}</p>
        </div>
      </div>

      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Historial de ventas</h2>
      {ventas.length === 0 ? (
        <div className="text-gray-600 text-sm">No hay ventas registradas para este cliente</div>
      ) : (
        <div className="space-y-3">
          {ventas.map((v) => (
            <div key={v.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{new Date(v.fecha).toLocaleDateString('es-CO')}</span>
                  <StatusBadge estado={v.estado} />
                </div>
                <span className="font-semibold text-gray-900">{formatCOP(v.total)}</span>
              </div>
              <div className="text-sm text-gray-600">
                Saldo: <span className="font-medium">{formatCOP(v.saldoPendiente)}</span>
              </div>
              <div className="flex gap-3 mt-2">
                <Link href={`/ventas/${v.id}`} className="text-sm text-blue-700 hover:text-blue-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                  Ver detalle
                </Link>
                {v.estado !== 'pagada' && (
                  <button onClick={() => setAbonoVentaId(v.id)} className="text-sm text-emerald-700 hover:text-emerald-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded">
                    Registrar abono
                  </button>
                )}
              </div>

              {abonoVentaId === v.id && (
                <form onSubmit={handleAbono} className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2 border border-gray-200">
                  <input value={abonoMonto} onChange={(e) => setAbonoMonto(e.target.value)} type="number" step="1" placeholder="Monto *" required className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <select value={abonoMetodo} onChange={(e) => setAbonoMetodo(e.target.value)} className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="otro">Otro</option>
                  </select>
                  <input value={abonoNotas} onChange={(e) => setAbonoNotas(e.target.value)} placeholder="Notas" className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-emerald-700 text-white rounded text-sm font-medium hover:bg-emerald-800 transition focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      Guardar abono
                    </button>
                    <button type="button" onClick={() => setAbonoVentaId(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300 transition focus:outline-none focus:ring-2 focus:ring-gray-500">
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
