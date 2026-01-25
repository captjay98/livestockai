# Guía de Despliegue

Guía completa para desplegar OpenLivestock Manager en producción.

---

## Requisitos Previos

- **Cuenta Cloudflare** (el nivel gratuito funciona)
- **Cuenta Neon** (el nivel gratuito funciona)
- **Cuenta GitHub** (para CI/CD)
- **Node.js 22+** o **Bun 1.0+**

---

## Inicio Rápido (5 minutos)

```bash
# 1. Clonar e instalar
git clone https://github.com/yourusername/openlivestock.git
cd openlivestock
bun install

# 2. Configurar base de datos
bun run db:migrate
bun run db:seed

# 3. Desplegar
bun run deploy
```

---

## Paso 1: Configuración de Base de Datos (Neon)

### Crear Proyecto Neon

1. Vaya a [console.neon.tech](https://console.neon.tech)
2. Haga clic en **New Project**
3. Elija la región más cercana a sus usuarios
4. Copie la cadena de conexión

### Configurar Base de Datos

```bash
# .env
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

### Ejecutar Migraciones

```bash
# Crear tablas
bun run db:migrate

# Sembrar datos iniciales (usuario admin + datos de referencia)
bun run db:seed

# Opcional: Sembrar datos de demostración para pruebas
bun run db:seed:dev
```

### Verificar Base de Datos

```bash
# Verificar que las tablas existen
bun run db:status

# O usar el Editor SQL de Neon
# Ejecutar: SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

---

## Paso 2: Configuración de Cloudflare Workers

### Instalar Wrangler CLI

```bash
npm install -g wrangler
# o
bun add -g wrangler
```

### Iniciar Sesión en Cloudflare

```bash
wrangler login
```

### Configurar Worker

Edite `wrangler.jsonc`:

```jsonc
{
  "name": "openlivestock-production",
  "main": "./.output/server/index.mjs",
  "compatibility_date": "2024-01-01",
  "compatibility_flags": ["nodejs_compat"],
  "vars": {
    "NODE_ENV": "production",
  },
}
```

### Establecer Secretos

```bash
# Conexión base de datos
wrangler secret put DATABASE_URL
# Pegue su cadena de conexión de Neon

# Secreto Better Auth (generar con: openssl rand -base64 32)
wrangler secret put BETTER_AUTH_SECRET

# Opcional: Proveedor SMS (Termii)
wrangler secret put TERMII_API_KEY

# Opcional: Proveedor Email (Resend)
wrangler secret put RESEND_API_KEY
```

---

## Paso 3: Construir & Desplegar

### Construir para Producción

```bash
bun run build
```

Esto crea un paquete optimizado en `.output/`.

### Desplegar en Cloudflare

```bash
bun run deploy
# o
wrangler deploy
```

### Verificar Despliegue

```bash
# Verificar estado del despliegue
wrangler deployments list

# Ver registros
wrangler tail
```

Su aplicación ahora está en vivo en: `https://openlivestock-production.your-subdomain.workers.dev`

---

## Paso 4: Dominio Personalizado (Opcional)

### Añadir Dominio a Cloudflare

1. Vaya al Panel de Cloudflare → Workers & Pages
2. Seleccione su worker
3. Haga clic en **Triggers** → **Custom Domains**
4. Añada su dominio (ej: `app.sugranja.com`)

### Actualizar DNS

Cloudflare configura automáticamente los registros DNS.

---

## Variables de Entorno

### Requerido

| Variable             | Descripción              | Ejemplo                   |
| -------------------- | ------------------------ | ------------------------- |
| `DATABASE_URL`       | Conexión PostgreSQL Neon | `postgresql://...`        |
| `BETTER_AUTH_SECRET` | Secreto de sesión Auth   | `openssl rand -base64 32` |

### Opcional

| Variable              | Descripción         | Predeterminado |
| --------------------- | ------------------- | -------------- |
| `SMS_PROVIDER`        | Servicio SMS        | `console`      |
| `EMAIL_PROVIDER`      | Servicio Email      | `console`      |
| `TERMII_API_KEY`      | Clave API Termii    | -              |
| `TERMII_SENDER_ID`    | ID remitente Termii | -              |
| `TWILIO_ACCOUNT_SID`  | SID cuenta Twilio   | -              |
| `TWILIO_AUTH_TOKEN`   | Token auth Twilio   | -              |
| `TWILIO_PHONE_NUMBER` | Teléfono Twilio     | -              |
| `RESEND_API_KEY`      | Clave API Resend    | -              |
| `SMTP_HOST`           | Servidor SMTP       | -              |
| `SMTP_PORT`           | Puerto SMTP         | `587`          |
| `SMTP_USER`           | Usuario SMTP        | -              |
| `SMTP_PASSWORD`       | Contraseña SMTP     | -              |
| `SMTP_FROM`           | Email remitente     | -              |

---

## CI/CD con GitHub Actions

### Crear Flujo de Trabajo (Workflow)

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Run tests
        run: bun run test

      - name: Build
        run: bun run build

      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### Añadir Secretos a GitHub

1. Vaya al repositorio de GitHub → Settings → Secrets
2. Añada `CLOUDFLARE_API_TOKEN`
3. Añada `DATABASE_URL`
4. Añada `BETTER_AUTH_SECRET`

---

## Monitoreo & Depuración

### Ver Registros

```bash
# Registros en tiempo real
wrangler tail

# Filtrar por estado
wrangler tail --status error

# Filtrar por método
wrangler tail --method POST
```

### Monitoreo de Rendimiento

Panel de Cloudflare → Workers & Pages → Analytics:

- Recuento de solicitudes
- Tasa de errores
- Tiempo de CPU
- Tiempo de respuesta

### Monitoreo de Base de Datos

Panel de Neon → Monitoring:

- Recuento de conexiones
- Rendimiento de consultas
- Uso de almacenamiento

---

## Escalado

### Cloudflare Workers

- **Nivel gratuito**: 100,000 solicitudes/día
- **Nivel de pago**: Solicitudes ilimitadas ($5/mes + $0.50/millón de solicitudes)
- **Auto-escalado**: Maneja picos de tráfico automáticamente

### Base de Datos Neon

- **Nivel gratuito**: 0.5 GB de almacenamiento, 1 unidad de cálculo
- **Nivel de pago**: Escale cálculo y almacenamiento independientemente
- **Agrupación de conexiones**: Integrado, sin configuración necesaria

---

## Respaldo & Recuperación

### Respaldos de Base de Datos

Neon proporciona respaldos automáticos:

- **Recuperación en un punto en el tiempo**: Restaure a cualquier punto en los últimos 7 días (nivel gratuito)
- **Respaldos manuales**: Cree una rama para respaldo a largo plazo

```bash
# Crear rama de respaldo
neon branches create --name backup-2026-01-15
```

### Exportar Datos

```bash
# Exportar todos los datos
pg_dump $DATABASE_URL > backup.sql

# Restaurar
psql $DATABASE_URL < backup.sql
```

---

## Lista de Verificación de Seguridad

- [ ] Usar un `BETTER_AUTH_SECRET` fuerte (32+ caracteres)
- [ ] Habilitar Cloudflare WAF (Web Application Firewall)
- [ ] Configurar limitación de tasa en Cloudflare
- [ ] Usar variables de entorno para todos los secretos
- [ ] Habilitar HTTPS solamente (predeterminado en Cloudflare)
- [ ] Revisar lista de permitidos de IP de Neon (si es necesario)
- [ ] Habilitar registro de auditoría
- [ ] Configurar alertas de monitoreo

---

## Solución de Problemas

### Errores de Construcción

**Error**: `Cannot find module '../db'`

**Solución**: Asegúrese de usar importaciones dinámicas en funciones del servidor:

```typescript
const { getDb } = await import('~/lib/db')
const db = await getDb() // ✅
```

### Errores de Conexión de Base de Datos

**Error**: `Connection timeout`

**Solución**: Verifique que el proyecto Neon esté activo (no suspendido):

```bash
# Despertar base de datos
curl $DATABASE_URL
```

### Errores de Worker

**Error**: `Script startup exceeded CPU limit`

**Solución**: Reduzca el tamaño del paquete:

```bash
# Analizar paquete
bun run build --analyze

# Verificar dependencias grandes
du -sh node_modules/*
```

### Errores de Migración

**Error**: `relation "table" already exists`

**Solución**: Verifique el estado de la migración:

```bash
bun run db:status

# Si es necesario, revierta y vuelva a ejecutar
bun run db:rollback
bun run db:migrate
```

---

## Optimización de Rendimiento

### Cloudflare

- Habilitar almacenamiento en caché para activos estáticos
- Usar Cloudflare CDN para imágenes
- Habilitar compresión Brotli
- Configurar reglas de caché personalizadas

### Base de Datos

- Añadir índices para consultas comunes (ya incluidos)
- Usar agrupación de conexiones (predeterminado de Neon)
- Monitorear consultas lentas en el panel de Neon
- Considerar réplicas de lectura para alto tráfico

### Aplicación

- Habilitar almacenamiento en caché PWA
- Optimizar imágenes (formato WebP)
- Carga diferida (lazy load) de componentes
- Usar React.memo para componentes costosos

---

## Estimación de Costos

### Nivel Gratuito (Adecuado para granjas pequeñas)

- **Cloudflare Workers**: 100,000 solicitudes/día
- **Base de Datos Neon**: 0.5 GB de almacenamiento, 1 unidad de cálculo
- **Total**: $0/mes

### Nivel de Pago (Adecuado para granjas medianas)

- **Cloudflare Workers**: $5/mes + uso
- **Base de Datos Neon**: $19/mes (2 unidades de cálculo, 10 GB)
- **Total**: ~$25/mes

### Empresarial (Granjas grandes, múltiples ubicaciones)

- **Cloudflare Workers**: Precios personalizados
- **Base de Datos Neon**: Precios personalizados
- **Total**: Contactar con ventas

---

## Próximos Pasos

1. **Configurar monitoreo**: Configure alertas para errores
2. **Habilitar respaldos**: Programe respaldos regulares de base de datos
3. **Dominio personalizado**: Añada el dominio de su granja
4. **SMS/Email**: Configure proveedores de producción
5. **Incorporación**: Cree la primera granja e invite usuarios

---

## Soporte

- **Documentación**: [docs/INDEX.md](./INDEX.md)
- **Problemas de GitHub**: [github.com/yourusername/openlivestock/issues](https://github.com/yourusername/openlivestock/issues)
- **Comunidad**: [Enlace Discord/Slack]

---

**Última Actualización**: 15 de Enero de 2026
