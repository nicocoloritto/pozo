> Archivo temporal para trabajar con Claude Code. Antes de la entrega se pasa a
> `docs/convenciones.md` y se borra.

# Pozo

App móvil de reclamos urbanos hiperlocales. El vecino fotografía un problema de la calle
(pozo, vereda rota, luminaria), lo geolocaliza y otros vecinos lo confirman. Cada reclamo se
trata como una **boleta municipal con expediente** y avanza por estados. Diseño funcional en
`docs/diseno-funcional.md`. Mockups de referencia en `design/`.
**Leé ese archivo antes de tocar código de dominio.** Si hay un sprint en curso, leé también
su consigna en `docs/sprints/`.

Es el TPO de Apps Móviles (UCA). Equipo de 3. Cronograma y qué clase habilita cada
funcionalidad: `docs/mapeo-materia.md`.

## Stack

| Capa | Tecnología |
|---|---|
| App | Expo + React Native + TypeScript · `expo-router` |
| Backend | Node + Express + TypeScript |
| ORM / DB | Prisma + SQLite (archivo `dev.db`) |
| Local en el dispositivo | AsyncStorage (sesión, preferencias) · expo-sqlite (borradores y caché offline) |
| Sensores | expo-camera (foto y lectura del PDF417 del DNI) / expo-image-picker · expo-location · react-native-maps |
| Gráficos | react-native-svg (rombos de categoría, franjas, sellos) |
| CI | GitHub Actions |

## Estructura del monorepo

```
mobile/          # App Expo
  app/           # Rutas de expo-router: (tabs)/ (con ranking.tsx), reports/[id].tsx, reports/new.tsx
  components/    # Componentes reutilizables (ReportCard, StatusStamp, CategoryChip…)
  theme/         # Tokens de color, tipografía y espaciado. Único lugar con colores.
  types/         # Tipos compartidos (Report, Category, Severity, ReportStatus…)
  data/          # Datos semilla para desarrollar sin backend (Sprint 1)
  constants/     # Etiquetas en español para mostrar en la UI (categorías, estados…)
  services/      # Cliente HTTP (fetch/axios) y acceso a AsyncStorage / SQLite
backend/
  src/
    routes/      # Un archivo por recurso: reports.ts, confirmations.ts, ranking.ts, auth.ts
    middleware/  # cors, json, manejo de errores, auth
    lib/         # cliente Prisma, utilidades (pick, errores)
  prisma/        # schema.prisma y migraciones
docs/            # Diseño funcional, modelo de datos, ADRs, sprints, backlog
design/          # Mockups HTML de Pozo (referencia visual)
```

## Comandos

```bash
# Backend
cd backend && npm install
npx prisma generate            # SIEMPRE después de tocar schema.prisma
npx prisma migrate dev         # aplica migraciones a la base local
npm run dev                    # API en :3000 — probá primero GET /api/health
npm test

# App
cd mobile && npm install
npm start                      # QR para Expo Go; "w" abre la versión web
npm run typecheck              # tsc --noEmit; todavía no hay linter configurado
```

`backend/.env` (no se commitea) necesita `DATABASE_URL="file:./dev.db"` y `PORT`.
`mobile/.env` necesita `EXPO_PUBLIC_API_URL` con la **IP de la PC en la Wi-Fi**, nunca
`localhost`: desde el celular `localhost` es el celular. Hay un `.env.example` de cada uno.

Troubleshooting rápido: `EADDRINUSE:3000` → otra terminal usa el puerto. `Network request
failed` → `API_URL` mal o celular en otra red. Ante cualquier falla, primero `/api/health`.

## Convenciones de la cátedra (las repetimos porque se evalúan)

**App**
- Estilos con `StyleSheet.create`; nada de estilos en línea salvo pruebas. Los colores salen
  de `mobile/theme/`, no se escriben hexadecimales sueltos.
- `Pressable`, no la familia `Touchable*`. Feedback con la función `pressed`.
- Todo texto va dentro de `<Text>`. Imágenes remotas siempre con `width` y `height`.
- Listas con `FlatList`/`SectionList` y `keyExtractor` estable (el `id`, nunca el índice).
- `resizeMode`: `cover` para fotos de reclamos y avatares, `contain` para logos.
- Animaciones con `Animated` y **`useNativeDriver: true`** (solo `transform` y `opacity`).
  Para expandir/colapsar o cambios de layout, `LayoutAnimation`.
- Componentes en TypeScript con `props` tipadas; estado con hooks.
- Tipografías solo desde `theme/` (familias por peso); nunca `fontWeight` ni `fontFamily`
  sueltos.

**Backend**
- `cors()` y `express.json()` **antes** de declarar rutas.
- Validá el body y hacé whitelisting con `pick()` en los `PATCH`.
- Todo handler async con `try/catch`. El error `P2025` de Prisma se traduce a **404**.
- Códigos semánticos: 200 lectura/actualización, 201 alta, 204 baja (sin cuerpo), 400 datos
  inválidos, 401/403 auth, 404 no existe.
- El cliente móvil nunca toca la base: solo habla HTTP. Tras crear o modificar, **vuelve a
  pedir la lista** en vez de mutar el estado a ciegas.

## Convenciones del proyecto

- **Código en inglés** (identificadores, tablas, rutas de API, nombres de archivo, logs).
  **Texto que ve el usuario, en español**, directo en los componentes; no montamos i18n.
  Nada de español en identificadores.
- **Documentación, commits y descripción de ramas en español.** El prefijo de Conventional
  Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`) va en inglés.
- Rutas de API: `/api/reports`, no `/api/reclamos`.
- Ramas: `feat/12-nuevo-reclamo`, sin tildes ni `ñ`.
- Dependencias: gratis y de código abierto (MIT/Apache/BSD). Proponé el paquete **con la
  licencia verificada** y esperá el OK; somos 3 y cada dependencia es deuda compartida.

## Glosario español → inglés (fuente única de verdad)

| Docs (español) | Código (inglés) | | Docs (español) | Código (inglés) |
|---|---|---|---|---|
| Reclamo / boleta | `Report` | | Barrio | `Neighborhood` |
| Categoría | `Category` | | Comuna | `comuna` (número) |
| Severidad | `Severity` | | Ranking / termómetro | `Ranking` |
| Estado | `ReportStatus` | | Vecino | `User` con `role: Neighbor` |
| Confirmación | `Confirmation` | | Municipalidad | `User` con `role: Municipality` |
| Historial de estados | `StatusChange` | | Expediente | `caseNumber` |
| Cuadrilla | `crewName` | | Urgente (calculado) | ver más abajo |

**Estados** (`ReportStatus`): `Reported` → `Validated` → `Escalated` → `InProgress` →
`Resolved`. `Validated` se alcanza a las **10 confirmaciones**, `Escalated` a las **50**
(constantes `CONFIRMATIONS_TO_VALIDATE` / `CONFIRMATIONS_TO_ESCALATE`, ver
`docs/modelo-de-datos.md`).

**Categorías**: `Pothole`, `BrokenSidewalk`, `TrafficLight`, `StreetLight`, `FallenPole`,
`Trench`, `Outage`, `OverflowingBin`. **Severidad**: `Low`, `Medium`, `High` — la elige el
vecino, son solo 3 niveles.

**"Urgente" no es un nivel de severidad**: es una etiqueta calculada en tiempo de lectura
(`severity == High && confirmations >= CONFIRMATIONS_TO_VALIDATE`), nunca un campo que se
guarda. No agregues un cuarto valor a `Severity` para esto.

**Roles y alta de cuenta:**
- `Neighbor`: se registra escaneando el **PDF417** del dorso del DNI con la cámara. No se
  guarda el número de documento en texto plano, solo `documentHash`.
- `Municipality`: cuenta interna, login con email y contraseña. Cambia el estado de un
  reclamo desde `Escalated` en adelante; no es una simulación, es una acción real de ese rol.

El origen de la ubicación de una foto se guarda en `Report.locationSource`: `Device` (GPS al
sacarla dentro de la app, la confiable), `Exif` (venía en una foto de la Galería) o `Manual`
(sin coordenadas disponibles, se usó y confirmó la ubicación actual). Ver
`docs/diseno-funcional.md`.

En el **Sprint 1 no hay backend**: los datos salen de `mobile/data/` (datos semilla), no de
una API.

## Flujo de ramas

```
feature ──PR──► dev ──PR──► main
```

- `main`: rama estable, la que se entrega y defiende. Solo recibe merges desde `dev`.
- `dev`: integración. Es la rama por defecto en GitHub.
- `<prefijo>/<issue>-descripcion-corta`: sale de `dev`, vuelve a `dev` por PR.
- feature → `dev`: **squash**. `dev` → `main`: **merge commit**. Se borra la rama después.
- `hotfix/` sale de `main`, vuelve a `main` y se mergea a `dev` en el acto.
- **Código de `mobile/` o `backend/`**: rama + PR, aunque nadie más lo revise; el PR es lo
  que dispara la CI antes de llegar a `dev`.
- **Docs, README, imágenes de diseño**: se puede subir directo a `dev`, sin PR.
- Antes de arrancar a trabajar, `git pull` en `dev`.

## Definition of Done

Funciona en el celular (Expo Go) y no solo en la web · lint y tests limpios · criterios de
aceptación de la story verificados usando la app · si toca la API, probada con la app y no
solo con Postman · README o docs actualizados si cambia un comando o una decisión.

## Cosas que NO tenés que hacer sin que te lo pida

- **Hacer `git commit`, `git push`, abrir PRs o mergear.** Dejá los cambios preparados,
  mostrá qué archivos entran y con qué mensaje, y esperá el OK.
- Agregar dependencias nuevas de npm.
- Correr migraciones contra una base que no sea la local, o borrar `dev.db`.
- Cambiar de rama, resetear o revertir sin avisar.
- Tocar los workflows de `.github/`.

