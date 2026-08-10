# Conversion File

> Plataforma de conversión de archivos con arquitectura de procesamiento asíncrono

Un portfolio técnico que demuestra:
- **Arquitectura escalable**: API separada de workers, manejo robusto de colas
- **Stack moderno**: Node.js + TypeScript, React, PostgreSQL, Redis
- **Procesamiento asíncrono**: BullMQ para gestión de trabajos, progreso en tiempo real
- **Infraestructura reproducible**: Docker Compose para desarrollo y producción

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend API | Fastify + TypeScript |
| Cola de trabajos | BullMQ + Redis |
| Worker | Node.js process |
| Base de datos | PostgreSQL + Prisma |
| Frontend | React + Vite + TypeScript + Tailwind |
| Tiempo real | WebSocket / SSE |
| Contenedores | Docker + Docker Compose |

## Instalación

### Requisitos previos
- Node.js 20+
- pnpm 11+
- Docker + Docker Compose

### Clonar y preparar

```bash
git clone https://github.com/Mavegari/conversion-file.git
cd conversion-file
pnpm install
```

### Ejecutar en desarrollo

```bash
# Terminal 1: levanta todos los servicios (Docker)
docker compose up

# Terminal 2: ejecuta en modo watch
pnpm dev
```

Accede en:
- Frontend: `http://localhost:5173`
- API: `http://localhost:3000`
- Bull Board: `http://localhost:3000/admin/queues`

## Estructura del proyecto

conversion-file/
├── apps/
│ ├── api/ # Fastify API
│ ├── worker/ # BullMQ worker
│ └── web/ # React frontend
├── packages/
│ └── shared/ # Tipos y utilidades compartidas
├── docker-compose.yml
└── pnpm-workspace.yaml

## Roadmap

- [x] Setup inicial (Fase 0)
- [ ] Infraestructura Docker (Fase 1)
- [ ] Base de datos y Prisma (Fase 2)
- [ ] API REST (Fase 3)
- [ ] Cola BullMQ (Fase 4)
- [ ] Conversión: Imágenes → PDF (Fase 5)
- [ ] Conversión: CSV → XLSX/JSON (Fase 6)
- [ ] Conversión: Office → PDF (Fase 7)
- [ ] Operaciones de PDF (Fase 8)
- [ ] Progreso en tiempo real (Fase 9)
- [ ] Frontend completo (Fase 10)
- [ ] Limpieza y seguridad (Fase 11)
- [ ] Testing (Fase 12)
- [ ] Observabilidad (Fase 13)
- [ ] CI/CD (Fase 14)
- [ ] Features stretch (Fase 15)

## Desarrollo

### Scripts disponibles

```bash
pnpm dev          # Ejecutar en desarrollo
pnpm build        # Build de todos los workspaces
pnpm lint         # Lint con ESLint
pnpm typecheck    # Type checking con TypeScript
pnpm test         # Ejecutar tests
pnpm format       # Formatear código con Prettier
```

## Licencia

MIT