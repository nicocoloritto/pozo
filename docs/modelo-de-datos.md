# Modelo de datos

Borrador inicial. Se ajusta en el Sprint 1 al implementar la API. Base: SQLite vía Prisma.

## Entidades

- **User**: el vecino. Email y contraseña (hasheada), nombre, barrio.
- **Report**: el reclamo. Categoría, severidad, estado, coordenadas, foto, notas, número de
  expediente (se asigna al pasar a `Sent`).
- **Confirmation**: un vecino confirma que el problema sigue ahí. Única por (reclamo, vecino).
- **StatusChange**: historial de estados de un reclamo.
- **Neighborhood**: barrio, para el ranking.

## Borrador de `schema.prisma`

SQLite no tiene enums nativos; Prisma los soporta desde la versión 6 sobre SQLite. Si la
versión instalada no los soporta, usar `String` y validar en la API.

```prisma
model User {
  id             Int            @id @default(autoincrement())
  email          String         @unique
  passwordHash   String
  displayName    String
  neighborhoodId Int?
  neighborhood   Neighborhood?  @relation(fields: [neighborhoodId], references: [id])
  reports        Report[]
  confirmations  Confirmation[]
  createdAt      DateTime       @default(now())
}

model Neighborhood {
  id      Int      @id @default(autoincrement())
  name    String   @unique
  users   User[]
  reports Report[]
}

model Report {
  id             Int            @id @default(autoincrement())
  category       String         // Pothole | BrokenSidewalk | TrafficLight | ...
  severity       String         // Minor | Serious | Urgent
  status         String         @default("Reported")
  notes          String?
  photoUrl       String
  latitude       Float
  longitude      Float
  address        String?
  caseNumber     String?        @unique
  authorId       Int
  author         User           @relation(fields: [authorId], references: [id])
  neighborhoodId Int?
  neighborhood   Neighborhood?  @relation(fields: [neighborhoodId], references: [id])
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
  id        Int      @id @default(autoincrement())
  reportId  Int
  report    Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)
  status    String
  createdAt DateTime @default(now())
}
```

## API REST (borrador)

| Método | Ruta | Descripción | Éxito |
|---|---|---|---|
| GET | `/api/health` | Diagnóstico | 200 |
| POST | `/api/auth/register` · `/api/auth/login` | Alta y sesión | 201 · 200 |
| GET | `/api/reports?near=lat,lng&radius=` | Lista, con filtros | 200 |
| GET | `/api/reports/:id` | Detalle con historial | 200 |
| POST | `/api/reports` | Crear reclamo | 201 |
| PATCH | `/api/reports/:id` | Editar notas/categoría (solo `Reported`) | 200 |
| DELETE | `/api/reports/:id` | Borrar propio en `Reported` | 204 |
| POST | `/api/reports/:id/confirmations` | Confirmar | 201 |
| PATCH | `/api/reports/:id/status` | Avanzar estado (simulación del municipio) | 200 |
| GET | `/api/ranking?by=neighborhood` | Termómetro | 200 |

## Local en el dispositivo

- **AsyncStorage**: token de sesión, barrio elegido, última pestaña de filtro.
- **expo-sqlite**: borradores de reclamos creados sin conexión y caché de la última lista
  cargada. Se sincroniza al volver la red.
