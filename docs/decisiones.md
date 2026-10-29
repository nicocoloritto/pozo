# Decisiones

Qué decidimos, por qué y dónde está en el código. Una entrada por tema; si una decisión
cambia, se edita su entrada (no se agrega otra al final).

## 1. Atrasado: la fecha estimada ya pasó

**Problema.** Antes el atraso dependía de un plazo por área contado desde la toma. Era una
regla que nadie del municipio podía ver ni ajustar reclamo por reclamo.

**Decisión.** Un reclamo está **atrasado** si tiene fecha estimada, esa fecha ya pasó (un día
completo después) y todavía no está cerrado. Ya no depende del plazo del área, que se borró.

- La fecha estimada solo se puede definir en `En reparación`, así que en la práctica solo
  los reclamos en reparación pueden estar atrasados.
- Se muestra como **"Atrasado"** en la fila de la bandeja, en el detalle del admin (junto a
  la fecha estimada) y en la tarjeta del tablero. En el mapa no: ahí solo van las secciones.

**Dónde.** Backend: `src/domain/prioridad.ts` (`estaAtrasado`); cada reclamo trae el campo
`atrasado`. La app solo lo muestra.

## 2. Prioridad de la bandeja: una fórmula que se puede explicar

**Decisión.** La prioridad es una suma de puntos, calculada (no guardada). Solo cuentan los
votos y la antigüedad:

| Qué | Puntos |
|---|---|
| Cada confirmación "Sigue ahí" | +10 |
| Cada voto "Ya no está" | −10 |
| Cada día desde que se creó | +2 |

El total nunca baja de 0.

**Por qué así.**

- **Ni la severidad ni la categoría suman.** Ordenan aparte, con el semáforo (ver abajo): la
  bandeja separa primero por severidad y esta fórmula solo desempata dentro de cada nivel. La
  categoría peligrosa ya no sube un reclamo en el orden; lo único que conserva es que el
  municipio puede tomarla sin esperar confirmaciones.
- **La antigüedad se cuenta desde la creación**, no desde la toma: mide cuánto lleva
  esperando el vecino.

**Cómo se ordena la bandeja y qué se ve.** El municipio no ve el número: ve un **semáforo**,
un ícono de alerta pintado con un color del theme. Sale solo de la severidad que eligió el
vecino; la categoría no cuenta:

| Severidad | Color |
|---|---|
| Alta (`High`) | rosa (`pink`) |
| Media (`Medium`) | mandarina (`mandarin`) |
| Baja (`Low`) | lima oscuro (`limeDeep`, por contraste) |

La bandeja ordena primero las altas, después las medias y las bajas; dentro de cada nivel,
por la prioridad (votos y antigüedad). El nivel lo calcula la app (`mobile/lib/peligrosidad.ts`);
la prioridad sigue viniendo del servidor. El ícono tiene texto de accesibilidad ("Severidad
alta / media / baja").

**Dónde.** Backend: `src/domain/prioridad.ts`. Los pesos están en `PUNTOS_PRIORIDAD`,
`desglosarPrioridad` arma el desglose y `calcularPrioridad` lo suma. Si cambian los pesos,
cambia esta tabla. Cada reclamo trae `prioridad`; la app solo la usa para ordenar dentro de
cada nivel. El desglose ya no viaja en la respuesta.

## 5. Prioridad y atraso se calculan en el servidor

**Problema.** La fórmula de prioridad y la regla de atraso vivían solo en la app. Cualquier
otro cliente (otra app, un panel web) tendría que copiarlas, y dos copias terminan
diferentes.

**Decisión.** El servidor las calcula en cada respuesta y las manda en el reclamo
(`prioridad`, `atrasado`). No se guardan en la base porque cambian solas con los días.
La app borró `lib/prioridad.ts`.

- Los vecinos también reciben estos campos. No muestran nada privado, y no hace falta separar
  respuestas por rol.

## 3. Reclamos duplicados: el servidor los controla al publicar

**Problema.** El chequeo de "ya hay uno parecido cerca" estaba solo en la app. Un pedido
directo a la API, o dos vecinos publicando a la vez, generaban el duplicado igual.

**Decisión.** `POST /reclamos` busca un reclamo **abierto** de la **misma categoría** a
**menos de 50 m** (de cualquier autor, incluido el propio). Si lo encuentra, no publica y
responde `409 RECLAMO_CERCANO` con ese reclamo y la distancia. La app muestra el mismo aviso
de antes ("Confirmar ese" / "Es otro problema, publicar igual").

- **"Publicar igual" sigue existiendo.** Dos pozos distintos pueden estar a 30 m. Si el
  vecino dice que es otro problema, la app reenvía con `publicarIgual: true` y el servidor
  publica. Es una decisión explícita del vecino, no un descuido.
- **Dos vecinos a la vez.** El chequeo y el alta corren en la misma transacción. Con SQLite
  las transacciones se ejecutan de a una, así que el segundo ya ve el reclamo del primero
  (hay un test que lo prueba). Si algún día se pasa a Postgres, hay que agregar un lock.
- **La foto no se sube dos veces.** Si el servidor responde `RECLAMO_CERCANO`, la app guarda la
  URL de la foto ya subida y la reusa si el vecino elige publicar igual.
- La app ya no descarga todos los reclamos para buscar duplicados: la regla vive en un solo
  lugar.

**Dónde.** Backend: `src/services/reclamos.ts` (`buscarCercano`, `publicar`) y
`src/domain/distancia.ts` (radio de 50 m). App: `mobile/services/reclamos.ts`
(`ReclamoCercanoError`) y `mobile/app/reclamos/new.tsx`.

## 4. Registro: avisar apenas se escanea un DNI que ya tiene cuenta

**Problema.** El aviso de "este DNI ya tiene cuenta" aparecía recién después de cargar email
y contraseña.

**Decisión.** Apenas se escanea el DNI, la app consulta `POST /auth/dni-registrado`. Si ya
hay cuenta, en lugar del formulario muestra el aviso y un botón **"Ir a iniciar sesión"**.

- **La consulta pide DNI + sexo + fecha de nacimiento**, los tres datos del mismo escaneo.
  Responde `registrado: true` solo si coinciden los tres. Así no sirve para averiguar si un
  DNI ajeno tiene cuenta sabiendo solo el número.
- **Si la consulta falla** (sin conexión), el registro sigue normal: el servidor igual rechaza
  un DNI repetido al registrar (`DNI_TAKEN`), que es la garantía real.
- **Límite conocido.** `POST /auth/registro` todavía responde `DNI_TAKEN` con solo el número
  (y cualquier sexo o fecha). Lo cierra el límite de intentos, que está pendiente.

**Dónde.** Backend: `src/services/auth.ts` (`dniRegistrado`) y `src/routes/auth.ts`. App:
`mobile/services/auth.ts` (`dniRegistrado`) y `mobile/app/register.tsx`.

## 6. Flujo de estados: los vecinos pueden cerrar, el municipio no elige el área

**Decisión.**

- **Confirmar:** alcanza 1 confirmación de otro vecino (`CONFIRMACIONES_NECESARIAS`; el autor
  no cuenta) para pasar a `Confirmado por vecinos`.
- **Ya no está:** con 10 votos (`VOTOS_YA_NO_ESTA_NECESARIOS`) el reclamo pasa solo a
  `Resuelto` desde cualquier estado abierto, sin foto. No es un rechazo: se resolvió y el
  municipio todavía no lo había actualizado. Cuenta como resuelto en las estadísticas.
- **Tomar:** asigna sola el área de la categoría (cada categoría está en una sola área). El
  admin ya no la elige; el área es interna y solo la usa el gráfico por área del tablero.
- **Rechazar:** motivo de una lista fija (`MOTIVOS_RECHAZO`) en `motivoRechazoTipo`, y el
  texto opcional en `motivoRechazo`. La app los muestra como "motivo: detalle".
- **Mapa:** `GET /reclamos?mapa=1` omite los resueltos o rechazados hace más de 7 días
  (`DIAS_CERRADO_EN_MAPA`, contados desde la entrada de cierre del historial). La lista y las
  estadísticas siguen mostrándolos.
- **Pantalla Reclamos (vecino):** la tab "Míos" pasó a "Reclamos" y lista todos; "Solo míos" filtra
  en la app por autor. El detalle muestra "X de N vecinos confirmaron" mientras está Reportado.
- **Textos de la app:** `Enviado al municipio` se muestra como "Tomado por el municipio"; el
  valor interno no cambia.
- **Pasar a reparación pide la fecha estimada:** `POST /reclamos/:id/reparacion` recibe
  `fechaEstimada`, obligatoria y no anterior a hoy (mismo criterio que "atrasado": hoy mismo
  vale). En `En reparación` el botón "Fecha estimada" pasa a "Cambiar fecha" y el servidor
  aplica la misma validación a `PUT /fecha-estimada`. En la app, el botón de resolver se
  llama "Resuelto" y pide la foto del después.
- **Fotos solo en vivo:** el reclamo nuevo y la foto del después se sacan con la cámara; no se
  elige de la galería. Por eso se borró la lectura del EXIF y el permiso de fotos. El servidor
  sigue aceptando `Exif` y `Manual` en `locationSource`, pero la app ya no los manda.
- **Mapa del admin:** los pines se pintan según la sección de la bandeja (Nuevos, En gestión,
  Cerrados) y el filtro "Sección" solo está en el mapa. El panel de filtros ya no tiene "Área".

**Por qué una columna aparte para el motivo.** Permite filtrar y contar por motivo sin
parsear texto.

**Dónde.** Backend: `src/domain/tipos.ts` (constantes), `src/domain/maquinaEstados.ts`
(`decidirTomar`, `decidirResolverPorVecinos`, `decidirRechazar`) y `src/services/reclamos.ts`.
App: `mobile/types/reclamo.ts` y `mobile/lib/maquinaEstados.ts`.
