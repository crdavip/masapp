import { NextResponse } from 'next/server'
import prisma from '../../../../lib/db'

export async function GET(_: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const p = await Promise.resolve(params as unknown as Promise<{ id: string }>)
    const cliente = await prisma.cliente.findUnique({ where: { id: p.id } })
    if (!cliente) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const ventas = await prisma.venta.findMany({
      where: { clienteId: p.id },
      include: { items: true, abonos: { orderBy: { fecha: 'desc' } } },
      orderBy: { fecha: 'desc' },
    })
    return NextResponse.json({ cliente, ventas })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg ?? 'Error fetching cliente' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const p = await Promise.resolve(params as unknown as Promise<{ id: string }>)
    const body = await request.json()
    const cliente = await prisma.cliente.update({ where: { id: p.id }, data: body })
    return NextResponse.json(cliente)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg ?? 'Error updating cliente' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const p = await Promise.resolve(params as unknown as Promise<{ id: string }>)
    await prisma.cliente.delete({ where: { id: p.id } })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg ?? 'Error deleting cliente' }, { status: 500 })
  }
}
