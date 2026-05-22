import { NextResponse } from 'next/server'
import prisma from '../../../../lib/db'

export async function GET(_: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const p = await Promise.resolve(params as unknown as Promise<{ id: string }>)
    const producto = await prisma.producto.findUnique({ where: { id: p.id } })
    if (!producto) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(producto)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg ?? 'Error fetching producto' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const p = await Promise.resolve(params as unknown as Promise<{ id: string }>)
    const body = await request.json()
    const producto = await prisma.producto.update({ where: { id: p.id }, data: body })
    return NextResponse.json(producto)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg ?? 'Error updating producto' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const p = await Promise.resolve(params as unknown as Promise<{ id: string }>)
    await prisma.producto.delete({ where: { id: p.id } })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg ?? 'Error deleting producto' }, { status: 500 })
  }
}
