# Pozo

> Reclamos urbanos hiperlocales: fotografiás el problema de tu cuadra, tus vecinos lo
> confirman y el municipio lo gestiona como un expediente.

TP de Apps Móviles, UCA. App móvil hecha con Expo y React Native.

## ¿Qué es Pozo?

Un pozo en la esquina, una vereda rota, una luminaria apagada o un contenedor desbordado:
todos los vecinos lo ven, pocos lo reportan y casi nadie sabe si el reclamo llegó a algún
lado. Los canales de atención suelen ser lentos, opacos y desconectados del lugar donde
está el problema. El municipio, por su parte, recibe reclamos sueltos, duplicados y sin
evidencia, y le cuesta decidir qué atender primero.

Pozo resuelve las dos puntas. El **vecino** reporta con una foto sacada con la cámara de la
app y la ubicación real del teléfono, así cada reclamo llega con evidencia y coordenadas. Los
demás vecinos lo **confirman** con un toque: cuando junta suficientes confirmaciones, el
reclamo pasa a ser un pedido validado por la comunidad. A cada reclamo se le arma un
**expediente** con número de caso, historial de estados y fechas, que el vecino puede seguir
hasta que se resuelve.

Del otro lado, el **municipio** tiene su propio panel dentro de la misma app: una bandeja
priorizada (categorías peligrosas, severidad, confirmaciones y antigüedad; ver
[decisiones](docs/decisiones.md)), un mapa con
todos los reclamos, un tablero con estadísticas y las herramientas para gestionarlos
(asignar un área, fijar una fecha estimada, pasar a reparación, resolver con foto del
"después" o rechazar con motivo). Se avisa cuando un reclamo está vencido respecto del plazo
de su área.

## Equipo

- Martín Allende ([@martinallende02](https://github.com/martinallende02))
- Nicolas Coloritto ([@nicocoloritto](https://github.com/nicocoloritto))
- Isidro Pasman ([@isidropasman](https://github.com/isidropasman))

## Documentación y créditos

- **Entrega del Sprint 1:**
  - [`Pozo-Sprint1-Presentacion.pdf`](docs/Entrega-Sprint1/Pozo-Sprint1-Presentacion.pdf):
    temática, público objetivo, diferencial, modelo de negocio, branding y componentes nativos.
  - [`Pozo-Mockup.pdf`](docs/Entrega-Sprint1/Pozo-Mockup.pdf): mockup con las pantallas del
    vecino y del municipio, y el circuito de estados.
- **Diseño funcional:** [`docs/diseno-funcional.md`](docs/diseno-funcional.md): roles, estados, reglas
  de negocio y comportamiento de cada pantalla.


## Funcionalidades

### Vecino

- **Registro con el DNI:** se escanea el código PDF417 del dorso con la cámara. Los datos
  se completan solos.
- **Nuevo reclamo:** foto con la cámara (o de la galería), ubicación por GPS, categoría
  (pozo, vereda, semáforo, luminaria, poste, árbol caído, zanja, corte de luz o agua,
  residuos), severidad y notas.
- **Aviso de reclamo cercano:** al publicar, si ya hay un reclamo abierto de la misma
  categoría a menos de 50 metros, el servidor no lo publica y la app lo muestra para
  confirmarlo en lugar de duplicarlo.
  Si es un reclamo del propio usuario, se lo avisa.
- **Mapa:** todos los reclamos, con filtros por categoría y estado. Los reclamos muy
  cercanos se agrupan en un círculo con la cantidad; al tocarlo, el mapa hace zoom hasta
  separarlos. Si están en el mismo punto exacto, se muestra una lista para elegir cuál abrir.
- **Confirmar reclamos de otros vecinos** (una vez por persona, nunca el propio).
- **Mis reclamos y detalle:** línea de tiempo del expediente, foto, mapa, antes y después
  cuando se resuelve.
- **Estadísticas por barrio.**

### Municipio

- **Bandeja** con tres segmentos (Nuevos, En gestión, Cerrados), búsqueda por dirección y
  filtros por barrio, comuna, categoría y área. Orden por prioridad y marca de **vencido**.
- **Mapa** con los mismos filtros, marca visual para los reclamos vencidos y los peligrosos, y
  una tarjeta que abre el detalle con gestión.
- **Gestión del reclamo:** tomar, asignar área, fijar fecha estimada, pasar a reparación,
  resolver (la foto del "después" es obligatoria), rechazar (el motivo es obligatorio) y
  agregar notas públicas.
- **Tablero** con estadísticas del municipio.

### Circuito de estados de un reclamo

```mermaid
stateDiagram-v2
    [*] --> Reportado: el vecino publica
    Reportado --> ConfirmadoPorVecinos: 3 confirmaciones de otros vecinos
    Reportado --> EnviadoAlMunicipio: el municipio lo toma (categoría peligrosa)
    ConfirmadoPorVecinos --> EnviadoAlMunicipio: el municipio lo toma
    EnviadoAlMunicipio --> EnReparacion: se asigna un área
    EnReparacion --> Resuelto: foto del "después"
    Reportado --> Rechazado: con motivo
    ConfirmadoPorVecinos --> Rechazado: con motivo
    EnviadoAlMunicipio --> Rechazado: con motivo
    EnReparacion --> Rechazado: con motivo
    Resuelto --> [*]
    Rechazado --> [*]
```

Los dos primeros estados los produce el vecino; del tercero en adelante los cambia solo el
municipio. Las categorías peligrosas (poste caído, árbol caído, corte de luz o agua y
semáforo) pueden pasar directo al municipio sin esperar confirmaciones. `Resuelto` y
`Rechazado` son estados finales.

## Stack y decisiones técnicas

| Pieza | Elección |
|---|---|
| App | **Expo** (SDK 57) + React Native + TypeScript |
| Navegación | **expo-router**: rutas por archivos, grupos de tabs separados para vecino y municipio |
| Cámara | **expo-camera**: foto del reclamo y lectura del PDF417 del DNI (componente nativo) |
| Ubicación | **expo-location**: GPS real y dirección aproximada (componente nativo) |
| Mapa | **react-native-maps** (Apple Maps en iOS, Google Maps en Android) |
| Agrupado de marcadores | **supercluster** (JavaScript puro, funciona en Expo Go) |
| Servidor | **API propia** (repo [pozo-backend](https://github.com/nicocoloritto/pozo-backend): Express, Prisma y SQLite). La app guarda solo el token de sesión en **AsyncStorage** |
| Gráficos y sellos | react-native-svg |

Decisiones:

- **Servicios que hablan con la API.** Las pantallas nunca llaman a la red: usan funciones de
  `services/` (`login`, `publicarReclamo`, `confirmarReclamo`, `tomar`, `resolver`…), que a su
  vez llaman al servidor a través de `services/api.ts`. Las reglas (estados, confirmaciones,
  permisos) las aplica el servidor; la app solo valida lo mínimo para avisar rápido.
- **Reglas de negocio puras.** La máquina de estados (`lib/maquinaEstados.ts`) y la distancia
  entre reclamos (`lib/distancia.ts`) son funciones sin efectos, fáciles de probar. La
  prioridad y el vencimiento los calcula el servidor y llegan en cada reclamo.
- **Datos de prueba en el servidor.** Usuarios, reclamos, barrios y áreas de ejemplo los carga
  el backend con `npm run setup` (están en su carpeta `prisma/data`); la app ya no trae datos
  propios.
- **Sesión hidratada.** `AuthProvider` lee el token y el usuario guardados al montar, y
  recién entonces marca `isHydrated`; nada se escribe antes de eso.
- **Tokens de diseño.** Colores, tipografías y espaciado salen de `mobile/theme/`; no hay
  valores sueltos en las pantallas.
- **Un solo mapa.** El mapa del vecino y el del municipio comparten el mismo componente
  (`ReclamosMap`), así que las mejoras de uno llegan al otro.

## Estructura de carpetas

```
mobile/
  app/             Pantallas y rutas (expo-router)
    (tabs)/        Tabs del vecino: Mapa, Mis reclamos, Nuevo, Barrio, Perfil
    (admin)/       Tabs del municipio: Bandeja, Mapa, Tablero, Perfil
    reclamos/      Nuevo reclamo, reclamo publicado y detalle del vecino
    admin-reclamo/ Detalle con gestión del municipio
  components/      Piezas reutilizables (mapa, marcadores, sellos, modales)
  constants/       Etiquetas en español, íconos y colores de estados y categorías
  contexts/        AuthContext: sesión y estado de hidratación
  data/            Datos de prueba en JSON
  lib/             Reglas puras (estados, prioridad, distancia, filtros)
  services/        Acceso a datos: llamadas a la API (pozo-backend)
  theme/           Colores, tipografías y espaciado
  types/           Tipos compartidos
  assets/reclamos/ Fotos de los reclamos de prueba
docs/              Diseño funcional, modelo de datos, ADRs y sprints
```

## Cómo correrlo

### Requisitos

- Node.js (versión LTS) y npm.
- La app **Expo Go** en el celular (Android o iOS), en una versión compatible con el SDK 57.
- Celular y computadora en la misma red Wi-Fi.
- El **backend** corriendo en la computadora (ver abajo).

### Backend

La app necesita el servidor: sin él no hay login ni reclamos. Clonalo y levantalo en la
computadora (instrucciones en el README de [pozo-backend](https://github.com/nicocoloritto/pozo-backend)):

```bash
git clone https://github.com/nicocoloritto/pozo-backend.git
cd pozo-backend
npm install
cp .env.example .env
npm run setup
npm run dev
```

En desarrollo la app encuentra al servidor sola: usa la IP de la computadora que le da Expo y
el puerto 3000. Si usás `--tunnel` o el servidor está en otro lado, definí la dirección antes de
arrancar:

```bash
EXPO_PUBLIC_API_URL=http://192.168.0.10:3000 npx expo start
```

### Instalación y arranque

```bash
cd mobile
npm install
npx expo start
```

Escaneá el QR con la cámara (iOS) o desde Expo Go (Android). Con `w` se abre la versión web,
aunque la cámara y el mapa están pensados para el celular.

### Si el celular no se conecta: `--tunnel`

```bash
npx expo start --tunnel
```

Crea un túnel que funciona aunque el celular y la computadora estén en redes distintas o la
red bloquee conexiones entre dispositivos (redes de universidad, por ejemplo). La primera vez,
Expo pide instalar `@expo/ngrok`: aceptá. Es más lento que la red local.

### Problemas comunes

- **No conecta el celu:** revisá que estén en la misma Wi-Fi, que el firewall de la
  computadora permita Node y que la red no aísle los dispositivos. Si nada funciona, usá
  `--tunnel`.
- **"Project is incompatible with this version of Expo Go":** la versión de Expo Go no
  coincide con el SDK 57. Actualizá Expo Go desde la tienda de aplicaciones.
- **"No pudimos conectar con el servidor":** revisá que el backend esté corriendo, que el
  celular y la computadora estén en la misma Wi-Fi y que el firewall deje pasar el puerto 3000.
  Para volver a los datos de prueba, en el backend: `npm run db:reset`.
- **La caché de Metro da errores raros:** `npx expo start -c`.
- **Revisión de tipos:** `npm run typecheck` (no hay linter ni tests configurados todavía).

### Usuarios de prueba

Las carga el backend con `npm run setup`.

| Email | Contraseña | Rol |
|---|---|---|
| `vecino1@pozo.com` | `123456` | Vecino (Lucía, Caballito) |
| `vecino2@pozo.com` | `123456` | Vecino (Martín, Palermo) |
| `vecino3@pozo.com` | `123456` | Vecino (Noelia, Flores) |
| `admin@caba.gob.ar` | `123456` | Admin (municipio CABA) |

También se puede crear una cuenta de vecino nueva escaneando un PDF417 con el formato
`trámite@apellido@nombres@sexo@dni@ejemplar@nacimiento@emisión`. Los admin no se registran
desde la app. **Un DNI solo puede tener una cuenta:** si se vuelve a escanear uno ya
registrado, la app pide iniciar sesión en vez de crear otra.

Las cuentas y los reclamos viven en el servidor: cerrar sesión solo descarta la sesión en el
teléfono y no borra nada, así que se puede publicar un reclamo como `vecino1` y gestionarlo
después como `admin@caba.gob.ar`, desde cualquier teléfono conectado al mismo servidor.

Un vecino puede **eliminar su cuenta** desde Perfil → "Eliminar mi cuenta": se borran sus datos
personales y el DNI queda libre para registrarse de nuevo, pero sus reclamos siguen, sin su
nombre, porque el municipio y otros vecinos trabajan sobre ellos. Después de 5 contraseñas
incorrectas seguidas, el servidor bloquea el login de esa cuenta por 15 minutos.

## Próximos pasos

- **Base de datos del municipio:** que el municipio cargue y mantenga sus áreas, plazos,
  cuadrillas y barrios, y que se pueda sumar más de un municipio.
- **Notificaciones:** avisar al vecino cuando cambia el estado de su reclamo y al municipio
  cuando entra uno peligroso o se vence un plazo.
- **Modo sin conexión** con sincronización posterior.
