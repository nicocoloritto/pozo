# Pozo

App móvil de reclamos urbanos hiperlocales, construida con Expo + React Native. TPO de Apps
Móviles, UCA.

El vecino reporta un problema de la calle con foto y ubicación, otros vecinos lo confirman, y
el reclamo avanza por estados como un expediente: **Reportado → Confirmado → Enviado al
municipio → En reparación → Resuelto**. El envío al municipio se simula.

Este sprint es solo **FrontEnd**: la app usa datos estáticos, no hay backend todavía. La API
(Express + Prisma + SQLite) llega en el Sprint 2.

## Estructura

| Carpeta | Contenido |
|---|---|
| `mobile/` | App Expo (`expo-router`, TypeScript) |
| `docs/` | Diseño funcional, modelo de datos, ADRs, sprints y backlog |
| `design/` | Mockups HTML de referencia visual |

## Puesta en marcha

Requisitos: Node.js y la app **Expo Go** en el celular (Android o iOS).

1. `cd mobile && npm install`
2. `npm start` y escaneá el QR con Expo Go. Con "w" se abre la versión web.
3. SDK de Expo: **57**.

## Cómo trabajamos

- Flujo de ramas `feature → dev → main`, con PR y una aprobación.
- Cada sprint tiene su consigna y su backlog en [`docs/sprints/`](docs/sprints/).
- Las decisiones técnicas que cuesta revertir se registran en [`docs/adr/`](docs/adr/).
- Cómo se conecta cada clase de la materia con el proyecto: [`docs/mapeo-materia.md`](docs/mapeo-materia.md).

## Enlaces

- **Prototipo interactivo (Figma):** [Abrir prototipo](https://www.figma.com/proto/Kx7jqo5TdRHpUCyFCRYtKX/Pozo-%E2%80%94-Prototipo?node-id=5-1729&p=f&t=RrBYOwYcdLcOki0d-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=5%3A1729)
- **Mockup de referencia:** [`design/pozo-pantallas-hifi.html`](design/pozo-pantallas-hifi.html)
