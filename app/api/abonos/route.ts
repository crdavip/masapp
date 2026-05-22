import { NextResponse } from 'next/server'
import prisma from '../../../lib/db'
import { Prisma } from '@prisma/client'

export async function GET() {
  try {
    const abonos = await prisma.abono.findMany({ orderBy: { fecha: 'desc' } })
    return NextResponse.json(abonos)
  } catch {
    return NextResponse.json({ error: 'Error fetching abonos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ventaId, monto, metodoPago, notas } = body
    if (!ventaId || monto == null) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const montoNum = Number(monto)
    if (montoNum <= 0) {
      return NextResponse.json({ error: 'El monto debe ser mayor a 0' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const venta = await tx.venta.findUnique({ where: { id: ventaId } })
      if (!venta) throw new Error('Venta no encontrada')
      if (venta.estado === 'pagada') throw new Error('La venta ya está pagada')

      const nuevoSaldo = Number(venta.saldoPendiente) - montoNum
      if (nuevoSaldo < 0) throw new Error('El abono excede el saldo pendiente')

      const abono = await tx.abono.create({
        data: { ventaId, monto: montoNum.toFixed(2), metodoPago, notas },
      })

      const totalAbonos = await tx.abono.aggregate({
        where: { ventaId },
        _sum: { monto: true },
      })
      const sumaAbonos = Number(totalAbonos._sum.monto ?? 0)
      const totalVenta = Number(venta.total)
      let nuevoEstado: string
      if (sumaAbonos >= totalVenta) {
        nuevoEstado = 'pagada'
      } else if (sumaAbonos > 0) {
        nuevoEstado = 'parcial'
      } else {
        nuevoEstado = 'pendiente'
      }

      const ventaActualizada = await tx.venta.update({
        where: { id: ventaId },
        data: {
          saldoPendiente: nuevoSaldo.toFixed(2),
          estado: nuevoEstado,
        },
      })

      return { abono, venta: ventaActualizada }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ error: 'Error de base de datos' }, { status: 500 })
    }
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
