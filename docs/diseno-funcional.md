# Diseño funcional de Pozo

Fuente única de verdad del alcance. Los mockups están en `design/` y definen la dirección
visual; este documento define el comportamiento.

## Idea

Un reclamo urbano no es un "post": es una **boleta con expediente**. Cada reclamo lleva
coordenadas, foto, categoría, severidad, un estado de trámite y un historial. Cuantos más
vecinos lo confirman, más visible es.

## Dirección visual

- Fondo **Tiza** (`#EDEAE2`) en pantallas de datos; **Asfalto** (`#1C1B1A`) en onboarding,
  mapa, cámara y ranking.
- Acentos: amarillo `#E8B23D` (acción), óxido `#C0472B` (grave/FAB), verde `#4C7A5E`
  (resuelto), azul `#2E4C59` (enviado).
- Tipografías: **Archivo Black** (títulos y sellos), **Inter** (interfaz), **IBM Plex Mono**
  (coordenadas, IDs, fechas).
- Motivos: borde de ticket perforado, sello circular de estado, textura de asfalto.

## Actores

- **Vecino**: reporta, confirma, sigue sus reclamos. Único rol de la app.
- **Municipio (simulado)**: los cambios de estado posteriores a `Confirmed` los dispara un
  endpoint de administración o un botón de demo. No hay integración real.

## Estados del reclamo

```
Reported → Confirmed → Sent → InRepair → Resolved
```

- `Reported`: recién creado.
- `Confirmed`: alcanzó el umbral de confirmaciones (configurable; por defecto **3**).
- `Sent`: "enviado al municipio". Genera el número de expediente (`CABA-2026-A1174`).
- `InRepair` y `Resolved`: simulados.

Cada transición se guarda en `StatusChange` con fecha. No se puede saltar ni retroceder.

## Pantallas (ver `design/`)

| # | Pantalla | Comportamiento |
|---|---|---|
| 1 | Onboarding | Pitch, "Empezar a reportar", "Iniciar sesión", contador de reclamos |
| 2 | Mapa / Reclamos | Mapa con pines por categoría, tabs "Cerca mío / Mi barrio / Todos", lista de cercanos |
| 3 | Detalle | Foto, categoría, severidad, dirección, confirmaciones, días abierto, metadatos, botón "Confirmar que sigue ahí" |
| 4 | Nuevo reclamo | Foto de cámara, ubicación detectada, categoría, severidad, notas, "Publicar" |
| 5 | Mis reclamos | Contadores, filtros Todos/Pendientes/Resueltos, lista con sello de estado |
| 6 | Ranking (Termómetro) | Barrios con más reclamos activos; tabs Por barrio / Por vecino / Resueltos |

Pantalla del mockup **fuera de alcance del TPO**: perfil público con badges y escaneo de QR
en carteles municipales.

## Reglas de negocio

1. Un vecino no puede confirmar dos veces el mismo reclamo ni confirmar el propio.
2. Un reclamo necesita foto y coordenadas para publicarse.
3. La ubicación se toma con el GPS; el vecino no la escribe a mano.
4. La lista "Cerca mío" ordena por distancia dentro de un radio configurable (por defecto 1 km).
5. El ranking cuenta reclamos **activos** (no `Resolved`) por barrio.
6. Un vecino ve y edita solo sus reclamos en `Reported`; después son de solo lectura.

## Fuera de alcance

Integración real con el municipio, notificaciones push, moderación, cuentas con redes
sociales, i18n. Si sobra tiempo: gesto de deslizar sobre las boletas de "Mis reclamos".
