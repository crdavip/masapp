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
      // Find existing active sale for this client (append mode)
      const existingVenta = await tx.venta.findFirst({
        where: { clienteId, estado: { in: ['pendiente', 'parcial'] } },
        orderBy: { fecha: 'asc' },
      })

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
      let ventaId: string

      if (existingVenta) {
        // Append items to existing active sale
        ventaId = existingVenta.id

        for (const item of itemData) {
          await tx.ventaItem.create({
            data: {
              ventaId: existingVenta.id,
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

        // Update total and saldoPendiente (estado stays unchanged — only abonos change estado)
        await tx.venta.update({
          where: { id: existingVenta.id },
          data: {
            total: { increment: total },
            saldoPendiente: { increment: total },
          },
        })
        ventaId = existingVenta.id
      } else {
        // Create new sale (original flow)
        const venta = await tx.venta.create({
          data: {
            clienteId,
            total: totalStr,
            saldoPendiente: totalStr,
            estado,
            notas,
          },
        })
        ventaId = venta.id

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
      }

      const venta = await tx.venta.findUnique({
        where: { id: ventaId },
        include: { cliente: { select: { id: true, nombre: true } }, items: true, abonos: true },
      })

      return { ...venta, appended: !!existingVenta }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
