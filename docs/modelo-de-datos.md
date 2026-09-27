# Modelo de datos

Borrador actualizado tras revisar el prototipo de Figma (`design/figma/`). Se ajusta en el
Sprint 1/2 al implementar la API. Base: SQLite vía Prisma.

## Entidades

- **User**: cuenta de la app. Tiene un `role`: `Neighbor` (vecino) o `Municipality`.
- **Report**: el reclamo. Categoría, severidad, estado, ubicación, foto, notas, expediente.
- **Confirmation**: un vecino confirma que el problema sigue ahí. Única por (reclamo, vecino).
- **StatusChange**: historial de estados de un reclamo, con una descripción corta.
- **Neighborhood**: barrio y su comuna, para el ranking y para resolver la ubicación.

## Autenticación y roles

Dos flujos de alta distintos, mismo `User` con un `role` que los distingue:

- **Neighbor**: se registra escaneando el **código PDF417** del dorso de su DNI con la
  cámara (`expo-camera` soporta este formato de código de barras). Del código se toman
  nombre y apellido; **no se guarda el número de DNI en texto plano**, solo un hash
  (`documentHash`) para impedir cuentas duplicadas. El formato exacto del PDF417 argentino
  se termina de confirmar probándolo contra un DNI real; hasta entonces el parseo vive
  aislado en una función de `Infrastructure` para poder ajustarlo sin tocar el resto.
- **Municipality**: alta manual (seed/admin), login con email y contraseña.

## Borrador de `schema.prisma`

SQLite no tiene enums nativos; Prisma los soporta desde la versión 6 sobre SQLite. Si la
versión instalada no los soporta, usar `String` y validar en la API.

```prisma
model User {
  id             Int            @id @default(autoincrement())
  role           String         // Neighbor | Municipality
  displayName    String
  email          String?        @unique // solo Municipality
  passwordHash   String?        // solo Municipality
  documentHash   String?        @unique // solo Neighbor, hash del numero de DNI
  neighborhoodId Int?
  neighborhood   Neighborhood?  @relation(fields: [neighborhoodId], references: [id])
  reports        Report[]
  confirmations  Confirmation[]
  createdAt      DateTime       @default(now())
}

model Neighborhood {
  id      Int      @id @default(autoincrement())
  name    String   @unique
  comuna  Int      // numero de comuna (1 a 15 en CABA)
  users   User[]
  reports Report[]
}

model Report {
  id             Int            @id @default(autoincrement())
  category       String         // Pothole | BrokenSidewalk | TrafficLight | ...
  severity       String         // Low | Medium | High
  status         String         @default("Reported")
  notes          String?
  photoUrl       String
  latitude       Float
  longitude      Float
  accuracyMeters Float?
  locationSource String         // Device | Exif | Manual
  address        String?
  neighborhoodId Int?
  neighborhood   Neighborhood?  @relation(fields: [neighborhoodId], references: [id])
  caseNumber     String         @unique // asignado al crear: EXP-AA-NNNNN
  crewName       String?        // cuadrilla asignada, solo con status InProgress/Resolved
  authorId       Int
  author         User           @relation(fields: [authorId], references: [id])
  confirmations  Confirmation[]
  history        StatusChange[]
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
}

model Confirmation {
  id        Int      @id @default(autoincrement())
  reportId  Int
  userId    Int
  report    Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())

  @@unique([reportId, userId])
}

model StatusChange {
  id          Int      @id @default(autoincrement())
  reportId    Int
  report      Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)
  status      String
  description String   // "Validado x10", "Elevado a Comuna 6", "Cerrado por Cuadrilla 14"
  createdAt   DateTime @default(now())
}
```

## Umbrales de confirmación

Constantes de configuración, no valores escritos a mano en la lógica:

```
CONFIRMATIONS_TO_VALIDATE = 10   // Reported -> Validated
CONFIRMATIONS_TO_ESCALATE = 50   // Validated -> Escalated
```

Un reclamo se muestra como **"Urgente"** (etiqueta calculada, no un campo) cuando
`severity == High` y `confirmations >= CONFIRMATIONS_TO_VALIDATE`.

## Resolver ubicación (dirección, barrio, comuna)

Una sola función de `Infrastructure`, `resolveLocation(lat, lng)`, aislada del resto para
poder mejorarla sin tocar el modelo ni la API:

- **Sprint 1**: implementación mínima. Dirección: se puede dejar sin resolver (`address:
  null`) o resuelta en el cliente con `Location.reverseGeocodeAsync` de Expo. Barrio y
  comuna: tabla fija de los 48 barrios de CABA con un polígono simplificado o, más simple
  todavía, el centro de cada barrio y la distancia más corta.
- **Más adelante**: reemplazar por polígonos reales (punto en polígono) si hace falta más
  precisión, sin cambiar la firma de la función.

## API REST (borrador)

| Método | Ruta | Descripción | Éxito |
|---|---|---|---|
| GET | `/api/health` | Diagnóstico | 200 |
| POST | `/api/auth/register-neighbor` | Alta de vecino con datos leídos del PDF417 | 201 |
| POST | `/api/auth/login` | Sesión (vecino o municipalidad) | 200 |
| GET | `/api/reports?near=lat,lng&radius=` | Lista, con filtros | 200 |
| GET | `/api/reports/:id` | Detalle con historial | 200 |
| POST | `/api/reports` | Crear reclamo (asigna `caseNumber`) | 201 |
| PATCH | `/api/reports/:id` | Editar notas/categoría (solo `Reported`, autor) | 200 |
| DELETE | `/api/reports/:id` | Borrar propio en `Reported` | 204 |
| POST | `/api/reports/:id/confirmations` | Confirmar (dispara Validated/Escalated) | 201 |
| PATCH | `/api/reports/:id/status` | Avanzar estado (rol Municipality) | 200 |
| GET | `/api/ranking?by=neighborhood` | Termómetro | 200 |
| GET | `/api/stats/summary` | Contadores del onboarding (total, resueltos, barrios) | 200 |

## Local en el dispositivo

- **AsyncStorage**: token de sesión, rol activo, barrio elegido, última pestaña de filtro.
- **expo-sqlite**: borradores de reclamos creados sin conexión (con su foto y coordenadas ya
  capturadas) y caché de la última lista cargada. Se sincroniza al volver la red.
