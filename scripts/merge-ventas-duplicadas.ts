import prisma from '../lib/db'
import { Prisma } from '@prisma/client'

export interface MergeResult {
  clienteNombre: string
  salesMerged: number
  itemsMoved: number
  abonosMoved: number
}

type VentaWithIncludes = Prisma.VentaGetPayload<{
  include: { cliente: { select: { nombre: true } }; items: true; abonos: true }
}>

export async function mergeDuplicates(): Promise<MergeResult[]> {
  const ventas = await prisma.venta.findMany({
    where: { estado: { in: ['pendiente', 'parcial'] } },
    include: {
      cliente: { select: { nombre: true } },
      items: true,
      abonos: true,
    },
    orderBy: { fecha: 'asc' },
  })

  // Group by clienteId
  const grouped = new Map<string, VentaWithIncludes[]>()
  for (const v of ventas) {
    const arr = grouped.get(v.clienteId) || []
    arr.push(v)
    grouped.set(v.clienteId, arr)
  }

  const results: MergeResult[] = []

  for (const [clienteId, sales] of grouped) {
    if (sales.length < 2) continue

    const survivor = sales[0] // oldest (already sorted ASC)
    const nonSurvivors = sales.slice(1)

    const result = await prisma.$transaction(async (tx) => {
      let itemsMoved = 0
      let abonosMoved = 0

      for (const ns of nonSurvivors) {
        // Move items to survivor
        const itemMove = await tx.ventaItem.updateMany({
          where: { ventaId: ns.id },
          data: { ventaId: survivor.id },
        })
        itemsMoved += itemMove.count

        // Move abonos to survivor
        const abonoMove = await tx.abono.updateMany({
          where: { ventaId: ns.id },
          data: { ventaId: survivor.id },
        })
        abonosMoved += abonoMove.count

        // Delete non-survivor sale
        await tx.venta.delete({ where: { id: ns.id } })
      }

      // Recalculate survivor: total = sum of all item subtotals
      const updatedItems = await tx.ventaItem.findMany({
        where: { ventaId: survivor.id },
      })
      const newTotal = updatedItems.reduce((sum, item) => sum + Number(item.subtotal), 0)

      // Recalculate abonos sum
      const updatedAbonos = await tx.abono.findMany({
        where: { ventaId: survivor.id },
      })
      const sumAbonos = updatedAbonos.reduce((sum, ab) => sum + Number(ab.monto), 0)

      const newSaldoPendiente = newTotal - sumAbonos

      // Determine new estado
      let newEstado: string
      if (sumAbonos >= newTotal) {
        newEstado = 'pagada'
      } else if (sumAbonos > 0) {
        newEstado = 'parcial'
      } else {
        newEstado = 'pendiente'
      }

      await tx.venta.update({
        where: { id: survivor.id },
        data: {
          total: newTotal.toFixed(2),
          saldoPendiente: newSaldoPendiente.toFixed(2),
          estado: newEstado,
        },
      })

      return { itemsMoved, abonosMoved }
    })

    results.push({
      clienteNombre: survivor.cliente?.nombre ?? 'Unknown',
      salesMerged: nonSurvivors.length,
      itemsMoved: result.itemsMoved,
      abonosMoved: result.abonosMoved,
    })
  }

  return results
}

async function main() {
  const results = await mergeDuplicates()

  if (results.length === 0) {
    console.log('No duplicates found')
    process.exit(0)
  }

  for (const r of results) {
    console.log(
      `Cliente: ${r.clienteNombre} | Ventas fusionadas: ${r.salesMerged} | Items movidos: ${r.itemsMoved} | Abonos movidos: ${r.abonosMoved}`
    )
  }

  process.exit(0)
}

// Guard: only run main() when executed directly, not when imported by tests
if (!process.env.VITEST) {
  main().catch((e) => {
    console.error('Error merging duplicate sales:', e)
    process.exit(1)
  })
}
