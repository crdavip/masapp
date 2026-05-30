import { NextResponse } from 'next/server'
import { mergeDuplicates } from '@/scripts/merge-ventas-duplicadas'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  if (secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const results = await mergeDuplicates()

    if (results.length === 0) {
      return NextResponse.json({ message: 'No se encontraron ventas duplicadas para fusionar' })
    }

    return NextResponse.json({
      message: 'Fusión completada',
      total: results.length,
      detalles: results.map((r) => ({
        cliente: r.clienteNombre,
        ventasFusionadas: r.salesMerged,
        itemsMovidos: r.itemsMoved,
        abonosMovidos: r.abonosMoved,
      })),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
