# Pozo

App móvil de reclamos urbanos hiperlocales, construida con Expo + React Native. TPO de Apps
Móviles, UCA.

El vecino reporta un problema de la calle con foto y ubicación, otros vecinos lo confirman, y
el reclamo avanza por estados como un expediente: **Ingresado → Validado (10 confirmaciones)
→ Elevado a la comuna (50) → En curso → Resuelto**. A partir de "Elevado", el cambio de
estado lo hace el rol **Municipalidad**, una cuenta real dentro de la misma app. El vecino se
registra escaneando el código PDF417 del dorso de su DNI. Detalle completo en
[`docs/diseno-funcional.md`](docs/diseno-funcional.md).

Este sprint es solo **FrontEnd**: la app usa datos estáticos, no hay backend todavía. La API
(Express + Prisma + SQLite) llega en el Sprint 2.

## Estructura

| Carpeta | Contenido |
|---|---|
| `mobile/` | App Expo (`expo-router`, TypeScript) |
| `docs/` | Diseño funcional, modelo de datos, ADRs, sprints y backlog |
| `design/figma/` | Capturas del prototipo de Figma — referencia visual **vigente** |
| `design/pozo-pantallas-hifi.html` | Mockup anterior, **desactualizado** en flujo y datos |

## Puesta en marcha

Requisitos: Node.js y la app **Expo Go** en el celular (Android o iOS).

1. `cd mobile && npm install`
2. `npm start` y escaneá el QR con Expo Go. Con "w" se abre la versión web.
3. SDK de Expo: **57**.

## Cómo trabajamos

- Convenciones, stack, glosario y flujo de ramas: [`CONTRIBUTORS.md`](CONTRIBUTORS.md).
- Flujo de ramas `feature → dev → main`, con PR y una aprobación.
- Cada sprint tiene su consigna y su backlog en [`docs/sprints/`](docs/sprints/).
- Las decisiones técnicas que cuesta revertir se registran en [`docs/adr/`](docs/adr/).
- Cómo se conecta cada clase de la materia con el proyecto: [`docs/mapeo-materia.md`](docs/mapeo-materia.md).

## Enlaces

- **Prototipo interactivo (Figma):** [Abrir prototipo](https://www.figma.com/proto/Kx7jqo5TdRHpUCyFCRYtKX/Pozo-%E2%80%94-Prototipo?node-id=5-1729&p=f&t=RrBYOwYcdLcOki0d-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=5%3A1729)
  (armado para mostrar en clase; el flujo y los datos definitivos están en los docs, no en
  el prototipo).
- **Capturas de referencia:** [`design/figma/`](design/figma/)
