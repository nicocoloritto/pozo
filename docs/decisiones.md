# Decisiones

Qué decidimos, por qué y dónde está en el código. Una entrada por tema; si una decisión
cambia, se edita su entrada (no se agrega otra al final).

## 1. Vencido: el plazo corre desde que el municipio toma el reclamo

**Problema.** El plazo del área se contaba desde que se creó el reclamo. Un bache que esperó
20 días a juntar confirmaciones aparecía vencido el mismo día en que el municipio lo tomaba.

**Decisión.** El plazo se cuenta desde el primer `Enviado al municipio` del historial. Si un
reclamo viejo no tiene ese cambio en el historial, se usa la fecha de creación.

- Solo corre en `Enviado al municipio` y `En reparación`. Antes de la toma no hay nadie
  responsable; después de `Resuelto` o `Rechazado`, está cerrado.
- Sin área asignada se usa el plazo más corto de todas las áreas, para que no quede sin
  clasificar indefinidamente.
- En el mapa del municipio la leyenda dice **"Fuera de plazo del área"** en vez de "Vencido".

**Dónde.** Backend: `src/domain/prioridad.ts` (`estaVencido`), y cada reclamo trae el campo
`vencido`. La app solo lo muestra en la bandeja, el mapa y el tablero.

## 2. Prioridad de la bandeja: una fórmula que se puede explicar

**Decisión.** La prioridad es una suma de puntos, calculada (no guardada):

| Qué | Puntos |
|---|---|
| Categoría peligrosa (poste o árbol caído, corte, semáforo) | +50 |
| Severidad elegida por el vecino: baja / media / alta | 0 / +10 / +20 |
| Cada confirmación "Sigue ahí" | +10 |
| Cada voto "Ya no está" | −10 |
| Cada día desde que se creó | +2 |

El total nunca baja de 0.

**Por qué así.**

- **La severidad suma, pero poco.** La elige el autor y nadie la verifica: si pesara mucho,
  todos marcarían "Alta". Una severidad alta vale lo mismo que dos confirmaciones de otros
  vecinos, y nunca supera a una categoría peligrosa.
- **La antigüedad se cuenta desde la creación**, no desde la toma: mide cuánto lleva
  esperando el vecino. (El vencido, en cambio, mide al área, por eso cuenta desde la toma.)
- **Que se vea el porqué.** En la bandeja cada reclamo muestra su prioridad, y el detalle del
  municipio muestra el desglose (por ejemplo: Categoría peligrosa +50, Severidad alta +20,
  2 confirmaciones +20, 3 días abierto +6).

**Dónde.** Backend: `src/domain/prioridad.ts`. Los pesos están en `PUNTOS_PRIORIDAD`,
`desglosarPrioridad` arma el desglose y `calcularPrioridad` lo suma. Si cambian los pesos,
cambia esta tabla. Cada reclamo trae `prioridad` y `desglosePrioridad`; la app solo ordena
por ese número y muestra el desglose.

## 5. Prioridad y vencimiento se calculan en el servidor

**Problema.** La fórmula de prioridad y la regla de vencido vivían solo en la app. Cualquier
otro cliente (otra app, un panel web) tendría que copiarlas, y dos copias terminan
diferentes.

**Decisión.** El servidor las calcula en cada respuesta y las manda en el reclamo
(`prioridad`, `desglosePrioridad`, `vencido`). No se guardan en la base porque cambian solas
con los días. La app borró `lib/prioridad.ts`.

- El desglose viaja como texto listo para mostrar ("Severidad alta", +20). Así un cambio de
  fórmula no obliga a actualizar la app.
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
