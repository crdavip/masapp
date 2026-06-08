import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const ahora = new Date()
    const dias = (d: number) => new Date(ahora.getTime() - d * 24 * 60 * 60 * 1000)

    const ventas = await prisma.venta.findMany({
      where: {
        saldoPendiente: { gt: 0 },
        ultimoMovimiento: { lte: dias(5) },
      },
      select: {
        id: true,
        total: true,
        saldoPendiente: true,
        fecha: true,
        ultimoMovimiento: true,
        estado: true,
        cliente: { select: { id: true, nombre: true } },
      },
      orderBy: { ultimoMovimiento: 'asc' },
    })

    const notificaciones = ventas.map((v) => {
      const ultimo = v.ultimoMovimiento!
      const díasInactivo = Math.floor(
        (ahora.getTime() - ultimo.getTime()) / (1000 * 60 * 60 * 24),
      )
      return {
        ventaId: v.id,
        clienteId: v.cliente.id,
        clienteNombre: v.cliente.nombre,
        total: Number(v.total),
        saldoPendiente: Number(v.saldoPendiente),
        ultimoMovimiento: ultimo.toISOString(),
        díasInactivo,
        tipo: díasInactivo >= 8 ? 'vencido' : 'atencion',
      }
    })

    return NextResponse.json({
      total: notificaciones.length,
      atencion: notificaciones.filter((n) => n.tipo === 'atencion'),
      vencido: notificaciones.filter((n) => n.tipo === 'vencido'),
    })
  } catch {
    return NextResponse.json(
      { error: 'Error al cargar notificaciones' },
      { status: 500 },
    )
  }
}
