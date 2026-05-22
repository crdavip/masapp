import { NextResponse } from 'next/server'
import prisma from '../../../lib/db'

export async function GET() {
  try {
    const clientes = await prisma.cliente.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(clientes)
  } catch {
    return NextResponse.json({ error: 'Error fetching clientes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre, telefono, email, notas } = body
    if (!nombre) return NextResponse.json({ error: 'nombre is required' }, { status: 400 })
    const cliente = await prisma.cliente.create({ data: { nombre, telefono, email, notas } })
    return NextResponse.json(cliente, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error creating cliente' }, { status: 500 })
  }
}
