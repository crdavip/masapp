import { NextResponse } from 'next/server'
import prisma from '../../../../../lib/db'

class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const p = await Promise.resolve(params as unknown as Promise<{ id: string }>)
    const body = await request.json()

    if (!body.operations || !Array.isArray(body.operations) || body.operations.length === 0) {
      return NextResponse.json({ error: 'El array de operaciones no puede estar vacío' }, { status: 400 })
    }

    for (const op of body.operations) {
      if (!['add', 'remove', 'update'].includes(op.op)) {
        return NextResponse.json({ error: `Operación inválida: ${op.op}` }, { status: 400 })
      }
      if (op.op === 'add') {
        if (!op.productoId) return NextResponse.json({ error: 'productoId es requerido' }, { status: 400 })
        if (!op.cantidad || Number(op.cantidad) <= 0) return NextResponse.json({ error: 'cantidad debe ser mayor a 0' }, { status: 400 })
      }
      if (op.op === 'remove' && !op.ventaItemId) {
        return NextResponse.json({ error: 'ventaItemId es requerido' }, { status: 400 })
      }
      if (op.op === 'update') {
        if (!op.ventaItemId) return NextResponse.json({ error: 'ventaItemId es requerido' }, { status: 400 })
        if (!op.cantidad || Number(op.cantidad) <= 0) return NextResponse.json({ error: 'cantidad debe ser mayor a 0' }, { status: 400 })
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const venta = await tx.venta.findUnique({
        where: { id: p.id },
        include: {
          items: { include: { producto: true } },
          abonos: true,
        },
      })

      if (!venta) throw new ApiError(404, 'Venta no encontrada')

      const itemsById = new Map(venta.items.map(i => [i.id, i]))
      const sumAbonos = venta.abonos.reduce((s, a) => s + Number(a.monto), 0)
      let projectedTotal = Number(venta.total)
      const addProductos: Record<string, { producto: typeof venta.items[0]['producto']; precio: number }> = {}

      for (const op of body.operations) {
        if (op.op === 'add') {
          const producto = await tx.producto.findUnique({ where: { id: op.productoId } })
          if (!producto) throw new ApiError(400, `Producto no encontrado: ${op.productoId}`)
          const precio = op.precioUnitario != null ? Number(op.precioUnitario) : Number(producto.precioVenta)
          if (precio <= 0) throw new ApiError(400, 'precioUnitario debe ser mayor a 0')
          addProductos[op.productoId] = { producto, precio }
          projectedTotal += precio * Number(op.cantidad)
        } else if (op.op === 'remove') {
          const item = itemsById.get(op.ventaItemId)
          if (!item) throw new ApiError(400, `Item no encontrado: ${op.ventaItemId}`)
          projectedTotal -= Number(item.subtotal)
        } else if (op.op === 'update') {
          const item = itemsById.get(op.ventaItemId)
          if (!item) throw new ApiError(400, `Item no encontrado: ${op.ventaItemId}`)
          projectedTotal += (Number(op.cantidad) - item.cantidad) * Number(item.precioUnitario)
        }
      }

      if (projectedTotal < Number(venta.total)) {
        const projectedSaldo = projectedTotal - sumAbonos
        if (projectedSaldo < 0) throw new ApiError(400, 'La operación reduciría el saldo pendiente por debajo de 0')
      }

      const stockDeltas: Record<string, number> = {}
      for (const op of body.operations) {
        if (op.op === 'add') {
          stockDeltas[op.productoId] = (stockDeltas[op.productoId] || 0) - Number(op.cantidad)
        } else if (op.op === 'remove') {
          const item = itemsById.get(op.ventaItemId)!
          stockDeltas[item.productoId] = (stockDeltas[item.productoId] || 0) + item.cantidad
        } else if (op.op === 'update') {
          const item = itemsById.get(op.ventaItemId)!
          const delta = item.cantidad - Number(op.cantidad)
          if (delta !== 0) stockDeltas[item.productoId] = (stockDeltas[item.productoId] || 0) + delta
        }
      }

      for (const [productoId, delta] of Object.entries(stockDeltas)) {
        let currentStock: number
        const existingItem = venta.items.find(i => i.productoId === productoId)
        if (existingItem) {
          currentStock = existingItem.producto.cantidadStock
        } else if (addProductos[productoId]) {
          currentStock = addProductos[productoId].producto.cantidadStock
        } else {
          const prod = await tx.producto.findUnique({ where: { id: productoId } })
          currentStock = prod?.cantidadStock ?? 0
        }
        if (currentStock + delta < 0) {
          const nombre = existingItem?.producto.nombre ?? addProductos[productoId]?.producto.nombre ?? productoId
          throw new ApiError(400, `Stock insuficiente para ${nombre}`)
        }
      }

      for (const op of body.operations) {
        if (op.op === 'add') {
          const { precio } = addProductos[op.productoId]
          const subtotal = +(precio * Number(op.cantidad)).toFixed(2)
          await tx.ventaItem.create({
            data: {
              ventaId: p.id,
              productoId: op.productoId,
              cantidad: Number(op.cantidad),
              precioUnitario: precio.toFixed(2),
              subtotal: subtotal.toFixed(2),
            },
          })
          await tx.producto.update({
            where: { id: op.productoId },
            data: { cantidadStock: { decrement: Number(op.cantidad) } },
          })
        } else if (op.op === 'remove') {
          const item = itemsById.get(op.ventaItemId)!
          await tx.ventaItem.delete({ where: { id: op.ventaItemId } })
          await tx.producto.update({
            where: { id: item.productoId },
            data: { cantidadStock: { increment: item.cantidad } },
          })
        } else if (op.op === 'update') {
          const item = itemsById.get(op.ventaItemId)!
          const subtotal = +(Number(item.precioUnitario) * Number(op.cantidad)).toFixed(2)
          await tx.ventaItem.update({
            where: { id: op.ventaItemId },
            data: { cantidad: Number(op.cantidad), subtotal: subtotal.toFixed(2) },
          })
          const delta = item.cantidad - Number(op.cantidad)
          if (delta !== 0) {
            await tx.producto.update({
              where: { id: item.productoId },
              data: delta > 0
                ? { cantidadStock: { increment: delta } }
                : { cantidadStock: { decrement: Math.abs(delta) } },
            })
          }
        }
      }

      const finalSaldo = Math.max(projectedTotal - sumAbonos, 0)
      const finalEstado = finalSaldo <= 0 ? 'pagada' : sumAbonos > 0 ? 'parcial' : 'pendiente'

      await tx.venta.update({
        where: { id: p.id },
        data: {
          total: projectedTotal.toFixed(2),
          saldoPendiente: finalSaldo.toFixed(2),
          estado: finalEstado,
          ultimoMovimiento: new Date(),
        },
      })

      return await tx.venta.findUnique({
        where: { id: p.id },
        include: {
          items: { include: { producto: { select: { id: true, nombre: true } } } },
          abonos: { orderBy: { fecha: 'desc' } },
        },
      })
    })

    return NextResponse.json(result)
  } catch (err: unknown) {
    if (err instanceof ApiError) return NextResponse.json({ error: err.message }, { status: err.status })
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg ?? 'Error al procesar operaciones' }, { status: 500 })
  }
}
