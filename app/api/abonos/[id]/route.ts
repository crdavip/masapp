import { NextResponse } from 'next/server'
import prisma from '../../../../lib/db'

export async function GET(_: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const p = await Promise.resolve(params as unknown as Promise<{ id: string }>)
    const abono = await prisma.abono.findUnique({ where: { id: p.id } })
    if (!abono) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(abono)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg ?? 'Error fetching abono' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const p = await Promise.resolve(params as unknown as Promise<{ id: string }>)
    const body = await request.json()
    const abono = await prisma.abono.update({ where: { id: p.id }, data: body })
    return NextResponse.json(abono)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg ?? 'Error updating abono' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const p = await Promise.resolve(params as unknown as Promise<{ id: string }>)
    await prisma.abono.delete({ where: { id: p.id } })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg ?? 'Error deleting abono' }, { status: 500 })
  }
}
