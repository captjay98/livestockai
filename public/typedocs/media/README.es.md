# OpenLivestock Manager

<p align="center">
  <img src="../../public/logo-icon.png" alt="Logo de OpenLivestock" width="120" />
</p>

<p align="center">
  <strong>Gestión de ganado de código abierto y sin conexión, compatible con 6 tipos de ganado.</strong>
</p>

<p align="center">
  <a href="#características">Características</a> •
  <a href="#inicio-rápido">Inicio Rápido</a> •
  <a href="#despliegue">Despliegue</a> •
  <a href="#para-agentes-ia">Para Agentes IA</a> •
  <a href="#contribuyendo">Contribuyendo</a>
</p>

<p align="center">
  🌍 <strong>Idiomas:</strong>
  <a href="../../README.md">English</a> •
  <a href="README.fr.md">Français</a> •
  <a href="README.pt.md">Português</a> •
  <a href="README.sw.md">Kiswahili</a> •
  <a href="README.tr.md">Türkçe</a> •
  <a href="README.hi.md">हिन्दी</a>
</p>

---

## Características

### 🐔 Gestión Multi-Especie

- **Soporte modular de especies** — Avícola (pollos de engorde, ponedoras, pavos, patos), Acuicultura (bagre, tilapia), con arquitectura extensible para Ganado vacuno, Caprino, Ovino y Abejas.
- **Seguimiento del ciclo de vida del lote** — Desde la adquisición hasta la venta con gestión de estado (activo, agotado, vendido).
- **Métricas específicas por especie** — Tipos de alimentación, estándares de crecimiento y tipos de estructura por especie.
- **Soporte multi-granja** — Gestione múltiples granjas desde una sola cuenta con filtrado por granja.

### 📊 Análisis Predictivo & Monitoreo de Salud

- **Pronóstico de crecimiento** — Prediga fechas de cosecha y pesos objetivo utilizando curvas de crecimiento específicas.
- **Proyecciones de ingresos** — Estime ganancias basadas en muestras de peso actuales y precios de mercado.
- **Muestreo de peso** — Rastree pesos promedio, mínimo y máximo con tamaños de muestra.
- **Alertas de mortalidad** — Advertencias automáticas cuando los lotes superan los umbrales de mortalidad normales.
- **Seguimiento de mortalidad** — Registre muertes por causa (enfermedad, depredador, clima, desconocido) con análisis de tasas.
- **Calendarios de vacunación** — Rastree vacunaciones con recordatorios de fechas de vencimiento.
- **Calidad del agua** (Acuicultura) — Monitoree pH, temperatura, oxígeno disuelto, niveles de amoníaco.

### 💰 Gestión Financiera

- **Seguimiento de ventas** — Registre ventas por cantidad, peso o unidad con vinculación de clientes.
- **Gestión de gastos** — Gastos categorizados (alimentación, medicina, equipo, mano de obra, servicios públicos, etc.).
- **Facturación** — Genere facturas de clientes con partidas y seguimiento de estado de pago.
- **Informes de Pérdidas y Ganancias** — Análisis de P&L basado en períodos con desglose de ingresos y gastos.
- **Más de 20 ajustes preestablecidos de moneda** — Soporte internacional (USD, EUR, GBP, NGN, KES, ZAR, INR, etc.).

### 📦 Inventario & Alimentación

- **Inventario de alimentos** — Rastree niveles de stock con alertas de umbral bajo.
- **Inventario de medicamentos** — Monitoree cantidades con seguimiento de fecha de caducidad.
- **Consumo de alimento** — Registre alimentación diaria por lote con seguimiento de costos.
- **Análisis de conversión alimenticia** — Calcule índices de eficiencia (FCR).

### 👥 CRM & Contactos

- **Gestión de clientes** — Rastree compradores con información de contacto e historial de compras.
- **Gestión de proveedores** — Gestione incubadoras, fábricas de pienso, farmacias, proveedores de equipos.
- **Tipos de clientes** — Clasificación: Individual, restaurante, minorista, mayorista.

### 📱 Aplicación Web Progresiva (PWA)

- **Offline-first** — Funcionalidad completa sin internet; sincroniza cuando se reconecta.
- **Instalable** — Añadir a la pantalla de inicio en móvil y escritorio.
- **Actualizaciones automáticas** — El service worker maneja actualizaciones de la aplicación sin problemas.

### 🌍 Internacionalización

- **Moneda configurable** — Símbolo, decimales, posición, separadores.
- **Formatos de fecha** — MM/DD/AAAA, DD/MM/AAAA, AAAA-MM-DD.
- **Unidades** — Peso (kg/lbs), área (m²/sqft), temperatura (°C/°F).
- **Formatos de hora** — Reloj de 12 horas o 24 horas.

### 📋 Informes & Auditoría

- **5 tipos de informes** — Pérdidas/Ganancias, Inventario, Ventas, Alimentación, Huevos.
- **Filtrado por rango de fechas** — Análisis de período personalizado.
- **Capacidad de exportación** — Descargue informes para uso externo.
- **Registros de auditoría** — Historial completo de actividades con seguimiento de usuario, acción, entidad.

### 🔐 Seguridad & Auth

- **Better Auth** — Autenticación segura basada en sesiones.
- **Acceso basado en roles** — Roles de administrador y personal.
- **Rutas protegidas** — Todos los datos de la granja protegidos por autenticación.

---

## Capturas de Pantalla

<!-- TODO: Add screenshots -->

| Tablero                                                 | Gestión de Lotes                                           |
| ------------------------------------------------------- | ---------------------------------------------------------- |
| ![Tablero](../../screenshots/dashboard.png)             | ![Lotes](../../screenshots/batches.png)                    |
| _Resumen de granja con KPI, alertas y acciones rápidas_ | _Lista de lotes con estado, especie y tasas de mortalidad_ |

| Detalle del Lote                                             | Informes Financieros                                    |
| ------------------------------------------------------------ | ------------------------------------------------------- |
| ![Detalle del Lote](../../screenshots/batch-detail.png)      | ![Informes](../../screenshots/reports.png)              |
| _Gráfico de crecimiento, proyecciones y cronograma del lote_ | _Análisis de Pérdidas/Ganancias con desglose de gastos_ |

| Vista Móvil                            | Modo Sin Conexión                              |
| -------------------------------------- | ---------------------------------------------- |
| ![Móvil](../../screenshots/mobile.png) | ![Sin Conexión](../../screenshots/offline.png) |
| _Diseño sensible para uso en campo_    | _Funciona sin conexión a internet_             |

| Configuración                                    | Facturas                                           |
| ------------------------------------------------ | -------------------------------------------------- |
| ![Configuración](../../screenshots/settings.png) | ![Facturas](../../screenshots/invoices.png)        |
| _Preferencias de moneda, fecha y unidades_       | _Facturación de clientes con seguimiento de pagos_ |

## Stack Tecnológico

| Capa          | Tecnología                                                            |
| ------------- | --------------------------------------------------------------------- |
| Framework     | [TanStack Start](https://tanstack.com/start) (React 19, SSR)          |
| Base de Datos | PostgreSQL vía [Neon](https://neon.tech) (serverless)                 |
| ORM           | [Kysely](https://kysely.dev) (SQL tipado)                             |
| Estilo        | [Tailwind CSS v4](https://tailwindcss.com)                            |
| Estado        | [TanStack Query](https://tanstack.com/query) + Persistencia IndexedDB |
| Despliegue    | [Cloudflare Workers](https://workers.cloudflare.com)                  |

---

## Inicio Rápido

### Requisitos Previos

- **Node.js 22+** (o Bun 1.0+)
- **Cuenta Neon** — Gratis en [neon.tech](https://neon.tech) (la configuración de la base de datos es automatizada)

### 1. Clonar & Instalar

```bash
git clone https://github.com/yourusername/open-livestock-manager.git
cd open-livestock-manager
bun install
```

### 2. Configuración Automatizada

```bash
kiro-cli
@quickstart  # Asistente de configuración interactivo
```

El asistente de inicio rápido hará:

- ✅ Verificar su entorno (Node, Bun)
- ✅ Crear su base de datos automáticamente a través de Neon MCP
- ✅ Configurar variables de entorno
- ✅ Ejecutar migraciones y datos de demostración
- ✅ Iniciar el servidor de desarrollo

### 3. Empezar a Desarrollar

```bash
bun dev  # Si no se inició automáticamente
```

Abra [http://localhost:3001](http://localhost:3001)

### Credenciales de Inicio de Sesión Predeterminadas

Después de ejecutar el seeder, puede iniciar sesión con estas cuentas predeterminadas:

#### Seeder de Producción (`bun run db:seed`)

| Rol   | Correo electrónico          | Contraseña    |
| ----- | --------------------------- | ------------- |
| Admin | `admin@openlivestock.local` | `password123` |

#### Seeder de Desarrollo (`bun run db:seed:dev`)

| Rol   | Correo electrónico          | Contraseña    |
| ----- | --------------------------- | ------------- |
| Admin | `admin@openlivestock.local` | `password123` |
| Demo  | `demo@openlivestock.local`  | `demo123`     |

**⚠️ Nota de Seguridad**: Cambie estas contraseñas predeterminadas inmediatamente en entornos de producción. Puede establecer credenciales personalizadas a través de variables de entorno:

```env
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASSWORD=your-secure-password
ADMIN_NAME=Su Nombre
```

### Configuración Manual (Alternativa)

Si prefiere la configuración manual o no tiene Kiro CLI:

<details>
<summary>Haga clic para expandir las instrucciones de configuración manual</summary>

#### Configurar Entorno

```bash
cp .env.example .env
```

Edite `.env` con sus valores:

```env
# Database - Get a free Neon database at https://neon.tech
DATABASE_URL=postgresql://user:password@your-neon-host/dbname?sslmode=require

# Auth - Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=your-secret-key-at-least-32-chars
BETTER_AUTH_URL=http://localhost:3001
```

#### Inicializar Base de Datos

```bash
bun run db:migrate   # Ejecutar migraciones
bun run db:seed      # Sembrar datos de producción (usuario administrador + datos de referencia)
```

Para desarrollo con datos de demostración:

```bash
bun run db:seed:dev  # Sembrar datos de demostración completos
```

</details>

---

## Despliegue

### Cloudflare Workers (Recomendado)

1. Instale Wrangler CLI:

   ```bash
   bun add -g wrangler
   wrangler login
   ```

2. Establezca sus secretos:

   ```bash
   wrangler secret put DATABASE_URL
   wrangler secret put BETTER_AUTH_SECRET
   wrangler secret put BETTER_AUTH_URL
   ```

3. Desplegar:
   ```bash
   bun run deploy
   ```

### Otras Plataformas

La aplicación se puede desplegar en cualquier plataforma compatible con Node.js:

- Vercel
- Railway
- Render
- Auto-alojado con Docker

---

## Documentación

Guías completas para usuarios, desarrolladores y agentes de IA:

| Documento                                          | Descripción                       | Audiencia       |
| -------------------------------------------------- | --------------------------------- | --------------- |
| **[../docs/INDEX.md](../docs/INDEX.md)**           | **Centro de documentación**       | Todos           |
| [../AGENTS.md](../AGENTS.md)                       | Guía de desarrollo de agentes IA  | Asistentes IA   |
| [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) | Arquitectura del sistema          | Desarrolladores |
| [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md)     | Despliegue de producción          | DevOps          |
| [../docs/TESTING.md](../docs/TESTING.md)           | Estrategias de prueba             | Desarrolladores |
| [../docs/DATABASE.md](../docs/DATABASE.md)         | Esquema de base de datos & Kysely | Desarrolladores |
| [../docs/INTEGRATIONS.md](../docs/INTEGRATIONS.md) | Proveedores de SMS/Email          | Desarrolladores |
| [../DEVLOG.md](../DEVLOG.md)                       | Cronograma de desarrollo          | Todos           |
| [../CONTRIBUTING.md](../CONTRIBUTING.md)           | Guía de contribución              | Contribuidores  |

## Para Agentes IA

Este proyecto está diseñado para ser amigable con los agentes de IA. Vea estos recursos:

| Archivo                                  | Propósito                                        |
| ---------------------------------------- | ------------------------------------------------ |
| [../AGENTS.md](../AGENTS.md)             | Guía completa para asistentes de codificación IA |
| [../DEVLOG.md](../DEVLOG.md)             | Cronograma de desarrollo y decisiones            |
| [../.kiro/README.md](../.kiro/README.md) | Guía de configuración Kiro CLI                   |

### Configuración Kiro CLI

El proyecto incluye una configuración completa de Kiro CLI:

**Inicio Rápido:**

```bash
kiro-cli
@quickstart  # Asistente de configuración interactivo
```

**Agentes Disponibles (7):**

```bash
kiro-cli --agent livestock-specialist  # Experiencia en dominio
kiro-cli --agent backend-engineer      # DB, API, Kysely
kiro-cli --agent frontend-engineer     # React, UI, PWA
kiro-cli --agent devops-engineer       # Cloudflare, despliegue
kiro-cli --agent data-analyst          # Análisis, pronóstico
kiro-cli --agent qa-engineer           # Pruebas
kiro-cli --agent security-engineer     # Auth, seguridad
```

Vea [../.kiro/README.md](../.kiro/README.md) para la documentación completa.

---

## Estructura del Proyecto

```
├── app/
│   ├── components/     # Componentes de UI reutilizables
│   ├── lib/            # Lógica de negocio & utilidades
│   │   ├── auth/       # Autenticación (Better Auth)
│   │   ├── batches/    # Gestión de lotes
│   │   ├── db/         # Base de datos (Kysely + migraciones)
│   │   ├── finance/    # Cálculos financieros
│   │   └── ...         # Otros módulos de dominio
│   └── routes/         # Páginas TanStack Router
├── public/             # Activos estáticos
├── .kiro/              # Configuración de agente IA
│   ├── settings/       # Configs MCP
│   ├── steering/       # Pautas de codificación
│   └── specs/          # Especificaciones de características
└── ...
```

---

## Scripts

| Comando               | Descripción                                       |
| --------------------- | ------------------------------------------------- |
| `bun dev`             | Iniciar servidor de desarrollo                    |
| `bun build`           | Construir para producción                         |
| `bun test`            | Ejecutar pruebas                                  |
| `bun run lint`        | Ejecutar ESLint                                   |
| `bun run check`       | Formatear + lint                                  |
| `bun run db:migrate`  | Ejecutar migraciones de base de datos             |
| `bun run db:seed`     | Sembrar datos de producción (admin + referencias) |
| `bun run db:seed:dev` | Sembrar datos de demostración completos           |
| `bun run db:rollback` | Revertir última migración                         |
| `bun run deploy`      | Construir & desplegar en Cloudflare               |

---

## Contribuyendo

¡Damos la bienvenida a las contribuciones! Por favor, vea [../CONTRIBUTING.md](../CONTRIBUTING.md) para:

- Flujo de trabajo de desarrollo
- Convenciones de confirmación (commit)
- Pautas de solicitud de extracción (pull request)

---

## Licencia

Licencia MIT — vea [../LICENSE](../LICENSE) para más detalles.

---

<p align="center">
  Hecho con ❤️ para agricultores en todas partes
</p>
