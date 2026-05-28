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
    const startOfToday = bogotaMidnight('day')

    const [stockBajo, totalPorCobrar, ventasHoy, totalRecuperado] =
      await Promise.all([
        prisma.producto.findMany({
          where: { cantidadStock: { lte: 5 } },
          select: { nombre: true, cantidadStock: true },
          orderBy: { cantidadStock: 'asc' },
        }),
        prisma.venta.aggregate({
          _sum: { saldoPendiente: true },
          where: { estado: { not: 'pagada' } },
        }),
        prisma.venta.count({ where: { fecha: { gte: startOfToday } } }),
        prisma.abono.aggregate({ _sum: { monto: true } }),
      ])

    return NextResponse.json({
      totalPorCobrar: Number(totalPorCobrar._sum.saldoPendiente ?? 0),
      ventasHoy,
      totalRecuperado: Number(totalRecuperado._sum.monto ?? 0),
      stockBajo,
    })
  } catch {
    return NextResponse.json({ error: 'Error fetching dashboard data' }, { status: 500 })
  }
}
