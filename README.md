# Pozo

App móvil de reclamos urbanos hiperlocales, construida con Expo + React Native. TPO de Apps
Móviles, UCA.

El vecino reporta un problema de la calle con foto (cámara real) y ubicación (GPS real,
mapa con `react-native-maps`), otros vecinos lo confirman, y el reclamo avanza por estados
como un expediente: **Reportado → Confirmado por vecinos (3 confirmaciones) → Enviado al
municipio → En reparación → Resuelto**, con **Rechazado** como estado final alternativo
(motivo obligatorio). A partir de "Enviado al municipio", el cambio de estado lo hace el rol
**admin** (municipio), desde su propio panel (Bandeja, Tablero y Perfil) dentro de la misma
app — nunca el vecino.

Hay dos roles con flujos de alta distintos:
- **Vecino**: se registra escaneando el código PDF417 del dorso de su DNI.
- **Admin**: representa a un municipio (hoy solo CABA). No se registra desde la app, solo
  existe como dato de prueba precargado.

Detalle funcional completo (desactualizado respecto al código en varios puntos — la fuente
de verdad es `mobile/`) en [`docs/diseno-funcional.md`](docs/diseno-funcional.md).

Este sprint es solo **FrontEnd**: no hay backend todavía. Los datos (usuarios, reclamos,
barrios, estadísticas) viven en AsyncStorage, precargados una vez desde JSON de prueba. La
API (Express + Prisma + SQLite) llega en el Sprint 2.

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

Usuarios de prueba (todos con contraseña `123456`, precargados al abrir la app por primera
vez):

| Email | Rol |
|---|---|
| `vecino1@pozo.com` | Vecino |
| `vecino2@pozo.com` | Vecino |
| `vecino3@pozo.com` | Vecino |
| `admin@caba.gob.ar` | Admin (municipio CABA) |

También se puede crear una cuenta de vecino nueva escaneando cualquier PDF417 con el
formato `trámite@apellido@nombres@sexo@dni@ejemplar@nacimiento@emisión`. Los admin no se
registran desde la app.

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
