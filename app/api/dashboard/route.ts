import { NextResponse } from 'next/server'
import prisma from '../../../lib/db'

export async function GET() {
  try {
    const [clientesActivos, ventasPendientes, stockBajo] = await Promise.all([
      prisma.cliente.count(),
      prisma.venta.count({ where: { estado: { not: 'pagada' } } }),
      prisma.producto.findMany({ where: { cantidadStock: { lte: 5 } }, select: { nombre: true, cantidadStock: true }, orderBy: { cantidadStock: 'asc' } }),
    ])

    const totalPorCobrar = await prisma.venta.aggregate({ _sum: { saldoPendiente: true }, where: { estado: { not: 'pagada' } } })

    return NextResponse.json({
      clientesActivos,
      ventasPendientes,
      totalPorCobrar: totalPorCobrar._sum.saldoPendiente ?? 0,
      stockBajo,
    })
  } catch {
    return NextResponse.json({ error: 'Error fetching dashboard data' }, { status: 500 })
  }
}
