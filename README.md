# 📦 Masa | Gestión de Ventas

Plataforma web monousuario para gestionar clientes, inventario de productos y ventas a crédito con control de abonos. Construida con [Next.js](https://nextjs.org/) y enfocada en una experiencia mobile-first.

---

## 🧰 Tecnologías utilizadas

- **Next.js 16** – Framework React con App Router
- **React 19** – Librería para interfaces de usuario
- **TypeScript** – Tipado estático para mayor escalabilidad
- **Tailwind CSS 4** – Framework de estilos utilitarios
- **Lucide React** – Colección de iconos ligeros
- **Prisma 7** – ORM para PostgreSQL
- **NextAuth.js** – Autenticación con JWT
- **PostgreSQL** – Base de datos relacional

---

## ⚙️ Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/crdavip/masa.git
cd masa
```

### 2. Instalar las dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia `.env.example` a `.env` y edita con tus credenciales:

```bash
cp .env.example .env
```

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL de conexión PostgreSQL |
| `ADMIN_EMAIL` | Email del administrador (seed) |
| `ADMIN_PASSWORD` | Contraseña del administrador (seed) |
| `NEXTAUTH_SECRET` | Secreto para JWT |

### 4. Inicializar la base de datos

```bash
npm run prisma:migrate   # crear esquema de BD
npm run prisma:seed      # datos demo
```

### 5. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Accede a la aplicación en: http://localhost:3000

---

## 🧪 Scripts útiles

```bash
npm run dev               # Iniciar servidor de desarrollo
npm run build             # Compilar para producción
npm start                 # Iniciar servidor de producción
npm test                  # Ejecutar tests unitarios
npm run lint              # Ejecutar ESLint para verificar código
npm run prisma:generate   # Regenerar Prisma Client
npm run prisma:migrate    # Crear migración de base de datos
npm run prisma:seed       # Poblar base de datos con datos demo
```

---

## 📱 Módulos

- **Dashboard** — resumen con clientes activos, ventas pendientes, total por cobrar y alerta de stock bajo
- **Clientes** — CRUD con búsqueda, detalle con historial de ventas y registro de abonos
- **Productos** — CRUD con edición inline e indicador visual de stock bajo
- **Ventas** — creación con selección de cliente + productos + cálculo automático, detalle con abonos
- **Abonos** — registro desde vista de venta o cliente, actualiza saldo y estado automáticamente

---

## 👨‍💻 Autor

Desarrollado con ❤️ por **Cristian David**
🔗 [GitHub](https://github.com/crdavip)
