import { NextResponse } from 'next/server'
import prisma from '../../../lib/db'

export async function GET() {
  try {
    const productos = await prisma.producto.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(productos)
  } catch {
    return NextResponse.json({ error: 'Error fetching productos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre, precioVenta, precioCompra, cantidadStock } = body
    if (!nombre || precioVenta == null || cantidadStock == null) return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    const producto = await prisma.producto.create({ data: { nombre, precioVenta: precioVenta.toString(), precioCompra: precioCompra ? precioCompra.toString() : null, cantidadStock } })
    return NextResponse.json(producto, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error creating producto' }, { status: 500 })
  }
}
