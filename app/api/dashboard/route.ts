import { NextResponse } from 'next/server'
import prisma from '../../../lib/db'

/** Colombia no usa DST — offset fijo UTC-5 → midnight Bogotá = 5:00 UTC */
const BOGOTA_TZ = 'America/Bogota'

function bogotaMidnight(field: 'day' | 'month'): Date {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: BOGOTA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const [y, m, d] = fmt.format(new Date()).split('-').map(Number)
  if (field === 'month') return new Date(Date.UTC(y, m - 1, 1, 5, 0, 0, 0))
  return new Date(Date.UTC(y, m - 1, d, 5, 0, 0, 0))
}

export async function GET() {
  try {
    const startOfMonth = bogotaMidnight('month')
    const startOfToday = bogotaMidnight('day')

    const [
      clientesActivos,
      ventasPendientes,
      stockBajo,
      totalPorCobrar,
      totalRecuperadoRes,
      recuperadoEsteMesRes,
      ventasTotalesRes,
      ventasConSaldo,
      ventasHoy,
    ] = await Promise.all([
      prisma.cliente.count(),
      prisma.venta.count({ where: { estado: { not: 'pagada' } } }),
      prisma.producto.findMany({
        where: { cantidadStock: { lte: 5 } },
        select: { nombre: true, cantidadStock: true },
        orderBy: { cantidadStock: 'asc' },
      }),
      prisma.venta.aggregate({
        _sum: { saldoPendiente: true },
        where: { estado: { not: 'pagada' } },
      }),
      prisma.abono.aggregate({ _sum: { monto: true } }),
      prisma.abono.aggregate({
        _sum: { monto: true },
        where: { fecha: { gte: startOfMonth } },
      }),
      prisma.venta.aggregate({ _sum: { total: true } }),
      prisma.venta.findMany({
        where: { saldoPendiente: { gt: 0 } },
        select: {
          clienteId: true,
          saldoPendiente: true,
          cliente: { select: { nombre: true } },
        },
      }),
      prisma.venta.count({ where: { fecha: { gte: startOfToday } } }),
    ])

    const totalRecuperado = Number(totalRecuperadoRes._sum.monto ?? 0)
    const recuperadoEsteMes = Number(recuperadoEsteMesRes._sum.monto ?? 0)
    const ventasTotales = Number(ventasTotalesRes._sum.total ?? 0)
    const pctRecuperacion =
      ventasTotales > 0 ? Math.round((totalRecuperado / ventasTotales) * 100) : 0

    // Aggregate outstanding debt by client for top deudores
    const deudaMap = new Map<string, { nombre: string; total: number }>()
    for (const v of ventasConSaldo) {
      const prev = deudaMap.get(v.clienteId)
      if (prev) {
        prev.total += Number(v.saldoPendiente)
      } else {
        deudaMap.set(v.clienteId, {
          nombre: v.cliente.nombre,
          total: Number(v.saldoPendiente),
        })
      }
    }

    const topDeudores = [...deudaMap.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)

    return NextResponse.json({
      clientesActivos,
      ventasPendientes,
      totalPorCobrar: Number(totalPorCobrar._sum.saldoPendiente ?? 0),
      stockBajo,
      totalRecuperado,
      recuperadoEsteMes,
      ventasTotales,
      pctRecuperacion,
      clientesConDeuda: deudaMap.size,
      topDeudores,
      ventasHoy,
    })
  } catch {
    return NextResponse.json({ error: 'Error fetching dashboard data' }, { status: 500 })
  }
}
