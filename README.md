# Pozo

App móvil de reclamos urbanos hiperlocales, construida con Expo + React Native y una API
Express + Prisma + SQLite. TPO de Apps Móviles, UCA.

El vecino reporta un problema de la calle con foto y ubicación, otros vecinos lo confirman, y
el reclamo avanza por estados como un expediente: **Reportado → Confirmado → Enviado al
municipio → En reparación → Resuelto**. El envío al municipio se simula.

## Estructura

| Carpeta | Contenido |
|---|---|
| `mobile/` | App Expo (`expo-router`, TypeScript) |
| `backend/` | API REST con Express, Prisma y SQLite |
| `docs/` | Diseño funcional, modelo de datos, ADRs, sprints y backlog |
| `design/` | Mockups HTML de referencia visual |

## Puesta en marcha

Los comandos completos y el troubleshooting están en [CLAUDE.md](CLAUDE.md#comandos).

1. `cd backend && npm install && npx prisma generate && npx prisma migrate dev && npm run dev`
2. Verificá que `http://localhost:3000/api/health` responda.
3. `cd mobile && npm install && npm start` y escaneá el QR con Expo Go.
   `EXPO_PUBLIC_API_URL` tiene que apuntar a la IP de tu PC, no a `localhost`.

## Cómo trabajamos

- Flujo de ramas `feature → dev → main`, con PR y una aprobación. Ver [CLAUDE.md](CLAUDE.md#flujo-de-ramas).
- Cada sprint tiene su consigna y su backlog en [`docs/sprints/`](docs/sprints/).
- Las decisiones técnicas que cuesta revertir se registran en [`docs/adr/`](docs/adr/).
- Cómo se conecta cada clase de la materia con el proyecto: [`docs/mapeo-materia.md`](docs/mapeo-materia.md).
