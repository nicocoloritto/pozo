# Diseño funcional de Pozo

Fuente única de verdad del alcance. Las capturas del prototipo de Figma están en
`design/figma/` y son la referencia visual vigente. El HTML de `design/pozo-pantallas-hifi.html`
es un mockup anterior, más completo en detalle visual pero **desactualizado** en flujo y
datos: no lo uses como referencia para implementar.

## Idea

Un reclamo urbano no es un "post": es una **boleta con expediente**. Cada reclamo lleva
coordenadas, foto, categoría, severidad, un estado de trámite y un historial. Cuantos más
vecinos lo confirman, más peso tiene, hasta que se eleva a la comuna.

## Dirección visual

- Fondo **Tiza** (`#EDEAE2`) en pantallas de datos; **Asfalto** (`#1C1B1A`) en onboarding,
  mapa, cámara y ranking.
- Acentos: amarillo `#E8B23D` (acción), óxido `#C0472B` (grave/FAB/urgente), verde `#4C7A5E`
  (resuelto), azul `#2E4C59` (en curso/enviado).
- Tipografías: **Archivo Black** (títulos y sellos), **Inter** (interfaz), **IBM Plex Mono**
  (coordenadas, IDs, fechas).
- Motivos: franjas diagonales tipo cinta de peligro, sello circular de estado, rombos de
  categoría (cartel vial), textura de asfalto.

## Actores y roles

Dos roles con cuentas separadas (ver `docs/adr/` para la decisión de autenticación):

- **Vecino**: reporta, confirma, sigue reclamos. Se registra verificando su identidad con el
  **código PDF417** del dorso del DNI argentino (leído con la cámara).
- **Municipalidad**: cuenta interna, login con email y contraseña. Revisa los reclamos
  elevados, cambia su estado y asigna una cuadrilla. No es una simulación externa: es un rol
  real dentro de la misma app, con su propia interfaz.

## Estados del reclamo (`ReportStatus`)

```
Reported → Validated → Escalated → InProgress → Resolved
```

- **Reported** (`INGRESADO`): recién creado por un vecino.
- **Validated** (`VALIDADO`): alcanzó **10 confirmaciones** de otros vecinos.
- **Escalated** (`ELEVADO A COMUNA`): alcanzó **50 confirmaciones**. Se asigna la comuna y
  queda visible para el rol Municipalidad.
- **InProgress** (`EN CURSO`): la Municipalidad lo tomó y asignó una cuadrilla.
- **Resolved** (`RESUELTO`): la Municipalidad lo cerró. Guarda cuadrilla y días totales.

Cada transición se guarda en `StatusChange` con fecha y una descripción corta (ej.
"Validado ×10", "Elevado a Comuna 6"). No se puede saltar ni retroceder. Los umbrales (10 y
50) son una constante de configuración, no están escritos a mano en el código.

## Severidad y "Urgente"

El vecino elige la severidad al reportar: **Low / Medium / High** (Baja / Media / Alta). No
hay un cuarto nivel elegible.

**"Urgente" es una etiqueta calculada, no un dato guardado:** un reclamo se muestra como
urgente cuando `severity == High` **y** `confirmations >= UMBRAL_VALIDACION` (hoy 10, es
decir, ya validado). Esto evita que la severidad se infle al reportar y hace que la etiqueta
dependa de datos verificables por la comunidad.

## Pantallas (ver `design/figma/`)

| # | Archivo | Pantalla | Comportamiento |
|---|---|---|---|
| 01 | `01-onboarding.png` | Onboarding | Pitch, contador de reclamos, resueltos y barrios, "Empezar un reclamo" |
| 02 | `02-mapa.png` | Mapa / Reclamos | Mapa con pines por categoría, radio de 500 m, indicador de precisión GPS, "cuadra más rota", lista de cercanos |
| 03 | `03-detalle.png` | Detalle | Foto, categoría, severidad, dirección, coordenadas, confirmaciones, días abierto, puesto en el ranking del barrio, sello de estado, timeline, "Confirmar" / "Seguir" |
| 04 | `04-nuevo-reclamo.png` | Nuevo reclamo | Cámara (foto obligatoria, con galería y flash), ubicación detectada, categoría, severidad, notas opcionales, "Generar expediente" |
| 04b | `04b-permisos.png` | Permisos | Diálogo del sistema para ubicación y cámara; falta la pantalla de **permiso rechazado** (US-06) |
| 04c | `04c-reclamo-publicado.png` | Reclamo publicado | Sello "Expediente generado", número de expediente, "Ver en el mapa" |
| 05 | `05-mis-reclamos.png` | Mis reclamos | Contadores (reportados, confirmados por otros, resueltos), filtros Todos/Abiertos/Resueltos, lista con estado y días |
| 06 | `06-ranking.png` | Ranking (Termómetro) | Barrios con más reclamos activos en 30 días, tu barrio resaltado, variación semanal, tu cuadra |
| 07 | `07-perfil.png` | Perfil | Nombre, barrio, contadores, ajustes (notificaciones, barrio, cerrar sesión) |

Pantallas fuera del alcance del Sprint 1: bandeja y flujo de la Municipalidad (se documentan
cuando arranque ese trabajo), escaneo de QR en carteles municipales.

## Origen de la ubicación de una foto

Una foto sacada **dentro de la app** siempre es confiable: se piden las coordenadas al
disparar, y quedan asociadas al reclamo aunque se suba más tarde (soporta borradores sin
conexión). Una foto elegida de la **Galería** no tiene esa garantía: puede traer coordenadas
EXIF, o no traer ninguna. Por eso todo `Report` guarda de dónde salió su ubicación
(`locationSource`):

- `Device` — GPS del dispositivo en el momento de sacar la foto (más confiable).
- `Exif` — coordenadas leídas del archivo de la foto elegida en la Galería.
- `Manual` — no había coordenadas disponibles; se usó la ubicación actual del vecino y se le
  pidió confirmarla.

Por ahora la Galería se deja disponible sin restricciones adicionales; la política de qué
hacer cuando no hay EXIF se termina de definir probando en dispositivos reales.

## Reglas de negocio

1. Un vecino no puede confirmar dos veces el mismo reclamo ni confirmar el propio.
2. Un reclamo necesita foto y coordenadas para publicarse.
3. La ubicación se toma con el GPS o el EXIF de la foto (ver arriba); el vecino no la escribe
   a mano, aunque puede confirmarla si se usó `Manual`.
4. La lista "Cerca mío" ordena por distancia dentro de un radio de 500 m.
5. El ranking cuenta reclamos **activos** (no `Resolved`) por barrio, en los últimos 30 días.
6. Un vecino ve y edita solo sus reclamos en `Reported`; después son de solo lectura para él.
7. Solo la Municipalidad puede mover un reclamo de `Escalated` en adelante.

## Fuera de alcance del Sprint 1

Notificaciones push, moderación, "Seguir" un reclamo, polígonos reales de barrio/comuna
(se aproxima con una tabla fija), cálculo de "cuadra más rota", i18n. El escaneo de QR en
carteles municipales queda fuera de alcance del TPO por ahora.
