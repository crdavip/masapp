import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import bcrypt from 'bcrypt'

export async function GET() {
  try {
    const password = process.env.ADMIN_PASSWORD || 'changeme'
    const email = process.env.ADMIN_EMAIL || 'admin@example.com'
    const hash = await bcrypt.hash(password, 10)

    await prisma.user.upsert({
      where: { email },
      update: { passwordHash: hash },
      create: { email, passwordHash: hash },
    })

    const existingProducts = await prisma.producto.count()
    if (existingProducts === 0) {
      await prisma.producto.createMany({
        data: [
          { nombre: 'Producto A', precioVenta: 9.99, precioCompra: 5.0, cantidadStock: 100 },
          { nombre: 'Producto B', precioVenta: 19.99, precioCompra: 10.0, cantidadStock: 50 },
        ],
      })
    }

    const existingClientes = await prisma.cliente.count()
    if (existingClientes === 0) {
      await prisma.cliente.create({
        data: { nombre: 'Cliente Demo', telefono: '555-1234', email: 'cliente@demo.test' },
      })
    }

    return NextResponse.json({ message: 'Seed completado', admin: email })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
