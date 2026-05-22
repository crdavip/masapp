# Masa — Gestión de Ventas

Plataforma web monousuario para gestionar clientes, inventario de productos y ventas a crédito con control de abonos.

**Stack:** Next.js 16 (App Router) · Tailwind CSS v4 · PostgreSQL · NextAuth.js · Prisma v7

---

## Requisitos

- Node.js 20+
- PostgreSQL 14+
- npm

## Instalación

```bash
npm install
cp .env.example .env   # editar con tus credenciales
npm run prisma:migrate  # crear esquema de BD
npm run prisma:seed     # datos demo
npm run dev             # http://localhost:3000
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL de conexión PostgreSQL |
| `ADMIN_EMAIL` | Email del administrador (seed) |
| `ADMIN_PASSWORD` | Contraseña del administrador (seed) |
| `NEXTAUTH_SECRET` | Secreto para JWT |

## Comandos

```bash
npm run dev               # desarrollo
npm run build             # build producción
npm start                 # producción
npm test                  # tests unitarios
npm run lint              # ESLint
npm run prisma:generate   # regenerar Prisma Client
npm run prisma:migrate    # migración BD
npm run prisma:seed       # datos demo
```

## Módulos

- **Dashboard** — resumen con clientes activos, ventas pendientes, total por cobrar, stock bajo
- **Clientes** — CRUD con búsqueda, detalle con historial de ventas y abonos
- **Productos** — CRUD con edición inline e indicador visual de stock bajo
- **Ventas** — creación con selección de cliente + productos + cálculo automático, detalle con abonos
- **Abonos** — registro desde vista de venta o cliente, actualiza saldo y estado automáticamente

## Mobile

La aplicación es mobile-first con bottom navigation bar y diseño responsivo. Iconos con Lucide.
