import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
  datasource: {
    // Use process.env here so `prisma generate` doesn't fail when DATABASE_URL is not set
    url: process.env.DATABASE_URL ?? '',
  },
})
