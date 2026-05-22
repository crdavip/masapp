import { NextResponse } from 'next/server'
import prisma from '../../../../lib/db'

export async function GET(_: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const p = await Promise.resolve(params as unknown as Promise<{ id: string }>)
    const venta = await prisma.venta.findUnique({
      where: { id: p.id },
      include: {
        cliente: { select: { id: true, nombre: true } },
        items: { include: { producto: { select: { id: true, nombre: true } } } },
        abonos: { orderBy: { fecha: 'desc' } },
      },
    })
    if (!venta) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(venta)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg ?? 'Error fetching venta' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const p = await Promise.resolve(params as unknown as Promise<{ id: string }>)
    const body = await request.json()
    const venta = await prisma.venta.update({ where: { id: p.id }, data: body })
    return NextResponse.json(venta)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg ?? 'Error updating venta' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const p = await Promise.resolve(params as unknown as Promise<{ id: string }>)
    await prisma.venta.delete({ where: { id: p.id } })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg ?? 'Error deleting venta' }, { status: 500 })
  }
}
