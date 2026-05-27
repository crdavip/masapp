'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PageLayout from '@/components/PageLayout'
import StatCard from '@/components/StatCard'
import { formatCOP } from '@/lib/format'
import {
  Users,
  Receipt,
  DollarSign,
  Package,
  AlertTriangle,
  Wallet,
  TrendingUp,
  BarChart3,
  Percent,
  CreditCard,
  CalendarCheck,
  UserCheck,
} from 'lucide-react'

interface Deudor {
  nombre: string
  total: number
}

interface DashboardData {
  clientesActivos: number
  ventasPendientes: number
  totalPorCobrar: number
  stockBajo: { nombre: string; cantidadStock: number }[]
  totalRecuperado: number
  recuperadoEsteMes: number
  ventasTotales: number
  pctRecuperacion: number
  clientesConDeuda: number
  topDeudores: Deudor[]
  ventasHoy: number
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
  }, [])

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500 text-lg animate-pulse">Cargando...</div>
      </div>
    )
  }

  return (
    <PageLayout>
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-5">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-8">
        <StatCard icon={Users} label="Clientes activos" value={data.clientesActivos} />
        <StatCard icon={Receipt} label="Ventas pendientes" value={data.ventasPendientes} color="text-amber-700" />
        <StatCard icon={DollarSign} label="Total por cobrar" value={formatCOP(data.totalPorCobrar)} color="text-emerald-700" />

        <StatCard icon={Wallet} label="Total recuperado" value={formatCOP(data.totalRecuperado)} color="text-blue-700" />
        <StatCard icon={TrendingUp} label="Recuperado este mes" value={formatCOP(data.recuperadoEsteMes)} color="text-indigo-700" />
        <StatCard icon={Percent} label="% Recuperación" value={`${data.pctRecuperacion}%`} color="text-teal-700" />

        <StatCard icon={BarChart3} label="Ventas totales" value={formatCOP(data.ventasTotales)} color="text-gray-700" />
        <StatCard icon={CalendarCheck} label="Ventas hoy" value={data.ventasHoy} color="text-violet-700" />
        <StatCard icon={CreditCard} label="Clientes con deuda" value={data.clientesConDeuda} color="text-rose-700" />
      </div>

      {data.stockBajo.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-red-600" />
            <h2 className="text-sm font-semibold text-red-700">Productos con stock bajo</h2>
          </div>
          <ul className="space-y-1.5">
            {data.stockBajo.map(p => (
              <li key={p.nombre} className="flex items-center gap-2 text-sm text-gray-700">
                <Package size={14} className="text-gray-400 flex-shrink-0" />
                {p.nombre} — <span className="font-medium">{p.cantidadStock} unidades</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.topDeudores.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <UserCheck size={18} className="text-rose-600" />
            <h2 className="text-sm font-semibold text-rose-700">Top 3 deudores</h2>
          </div>
          <div className="space-y-2">
            {data.topDeudores.map((d, i) => (
              <div
                key={d.nombre}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-gray-700 truncate">{d.nombre}</span>
                </div>
                <span className="font-semibold text-gray-900 flex-shrink-0 ml-2">
                  {formatCOP(d.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Link href="/clientes" className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-blue-500">
          <Users size={22} className="text-blue-700" />
          <div>
            <p className="font-semibold text-gray-900">Clientes</p>
            <p className="text-xs text-gray-500">Gestionar</p>
          </div>
        </Link>
        <Link href="/productos" className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-blue-500">
          <Package size={22} className="text-blue-700" />
          <div>
            <p className="font-semibold text-gray-900">Productos</p>
            <p className="text-xs text-gray-500">Gestionar</p>
          </div>
        </Link>
        <Link href="/ventas" className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-blue-500">
          <Receipt size={22} className="text-blue-700" />
          <div>
            <p className="font-semibold text-gray-900">Ventas</p>
            <p className="text-xs text-gray-500">Gestionar</p>
          </div>
        </Link>
      </div>
    </PageLayout>
  )
}
