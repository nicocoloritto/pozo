# Mapeo con la materia (Apps Móviles, UCA)

Qué clase habilita cada parte de Pozo y qué reutilizamos de las tareas ya hechas.

## Cronograma

| # | Fecha | Tema | Aplicación en Pozo |
|---|---|---|---|
| 4 | 27/8 | Estilo, flexbox | Tokens de tema y layout de todas las pantallas |
| 5 | 3/9 | Navegación: stack, tabs, anidado | Tabs (Mapa, Barrio, Mis, Perfil) + stack de detalle y nuevo reclamo |
| 6 | 10/9 | Componentes y animaciones | FlatList del feed, modales, filtros, `Animated` y `LayoutAnimation` |
| 7 | 17/9 | Express, Prisma, REST, fetch/axios | API de reclamos y consumo desde la app |
| 8 | 24/9 | Permisos, GPS, cámara | Pantalla "Nuevo reclamo" |
| 9 | 1/10 | Revisión pre Sprint 1 | — |
| 10-11 | 8/10 y 15/10 | **Sprint 1** (FrontEnd, entrega 15/10 18hs) · arquitectura, AsyncStorage | PDF, mockup en Figma, app Expo con navegación y pantallas estáticas |
| 12 | 22/10 | SQLite embebida | Borradores y caché offline |
| 13 | 29/10 | **Sprint 2** · mapas | Mapa con marcadores |
| 14 | 5/11 | **Sprint 2** · PanResponder, integración | Gestos e integración completa |
| 15-16 | 12/11 y 19/11 | Entrega y defensa del TPO | Características adicionales asignadas |

## Qué reutilizamos de las tareas

Las tareas `tarea-clase4` y `tarea-clase5-galeria` usan **Expo + `expo-router` +
TypeScript**, así que Pozo arranca con la misma base. No se copian: se reusan los patrones.

| Tarea | Lo que hicimos | Dónde va en Pozo |
|---|---|---|
| Clase 4 · Tabs | `app/(tabs)/_layout.tsx` con `<Tabs>` y `tabBarIcon` | Barra inferior de Pozo. El botón "+" central del mockup es una `Tabs.Screen` con `tabBarButton` propio |
| Clase 4 · Tarjetas | `Tarjeta` recibe `texto` por props y cambia de estilo al tocarla (`Pressable`) | `ReportCard` y `CategoryChip`: props tipadas, estado seleccionado |
| Clase 4 · Perfil | `Modal` con `TextInput` para editar el nombre | Editar notas/nombre; el `Modal` de "Nuevo reclamo" |
| Clase 4 · Contador | `useState` + `Pressable` | Botón "Confirmar que sigue ahí" con contador de confirmaciones |
| Clase 5 · Galería | `FlatList` con `keyExtractor` | Feed "Cerca mío" y "Mis reclamos" |
| Clase 5 · Galería | `TextInput` que filtra la lista con `useMemo` | Filtros por categoría y estado |
| Clase 5 · Galería | `Modal` de detalle con imagen y `resizeMode` | Vista previa de foto del reclamo (`cover`) |
| Clase 5 · Galería | `onLongPress` marca favorito | Long press para confirmar o archivar un reclamo |
| Clase 5 · Galería | `data/productos.ts` con datos de prueba | Datos semilla (seed) de reclamos para desarrollar sin backend |
| Clase 5 · Galería | Imágenes con `require` y con `{ uri }` | Assets locales de onboarding y fotos remotas de reclamos |

## Diferencias a tener en cuenta

- Las tareas usaron colores sueltos (`#4f46e5`, etc.) en cada archivo. En Pozo salen de
  `mobile/theme/`.
- Los textos y nombres de las tareas están en español. En Pozo el código va en inglés.
- La clase 5 de la materia se dictó con React Navigation; las tareas usaron `expo-router`,
  que corre sobre React Navigation. Ver ADR-0001 pendiente.
