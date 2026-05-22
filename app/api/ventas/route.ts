import { NextResponse } from 'next/server'
import prisma from '../../../lib/db'

export async function GET() {
  try {
    const ventas = await prisma.venta.findMany({
      orderBy: { fecha: 'desc' },
      include: { cliente: { select: { id: true, nombre: true } }, items: true, abonos: true },
    })
    return NextResponse.json(ventas)
  } catch {
    return NextResponse.json({ error: 'Error fetching ventas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clienteId, estado = 'pendiente', notas, items } = body
    if (!clienteId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      let total = 0
      const itemData: { productoId: string; cantidad: number; precioUnitario: string; subtotal: string }[] = []

      for (const it of items) {
        const producto = await tx.producto.findUnique({ where: { id: it.productoId } })
        if (!producto) throw new Error(`Producto no encontrado: ${it.productoId}`)
        if (producto.cantidadStock < Number(it.cantidad)) {
          throw new Error(`Stock insuficiente para ${producto.nombre}`)
        }
        const precio = Number(it.precioUnitario ?? producto.precioVenta)
        const cantidad = Number(it.cantidad)
        const subtotal = +(precio * cantidad).toFixed(2)
        total += subtotal
        itemData.push({
          productoId: it.productoId,
          cantidad,
          precioUnitario: precio.toFixed(2),
          subtotal: subtotal.toFixed(2),
        })
      }

      const totalStr = total.toFixed(2)
      const venta = await tx.venta.create({
        data: {
          clienteId,
          total: totalStr,
          saldoPendiente: totalStr,
          estado,
          notas,
        },
      })

      for (const item of itemData) {
        await tx.ventaItem.create({
          data: {
            ventaId: venta.id,
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.subtotal,
          },
        })
        await tx.producto.update({
          where: { id: item.productoId },
          data: { cantidadStock: { decrement: item.cantidad } },
        })
      }

      return tx.venta.findUnique({
        where: { id: venta.id },
        include: { cliente: { select: { id: true, nombre: true } }, items: true, abonos: true },
      })
    })

    return NextResponse.json(result, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
