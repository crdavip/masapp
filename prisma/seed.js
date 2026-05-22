require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') })
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const bcrypt = require('bcrypt')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' })
const prisma = new PrismaClient({ adapter })

async function main() {
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

  console.log('Seed completado. Admin:', email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
