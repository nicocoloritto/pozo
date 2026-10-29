# Diseño funcional de Pozo

Qué hace la app y qué reglas cumple. Describe el comportamiento actual de `mobile/`; si el
código y este documento se contradicen, manda el código. Para las capturas ver el
[README](../README.md#capturas).

## Idea

Un reclamo urbano no es un "post": es un **expediente**. Cada reclamo lleva foto,
coordenadas, categoría, severidad, un estado de trámite y un historial. Los vecinos lo
confirman, y el municipio lo gestiona desde su propio panel dentro de la misma app.

## Roles

Dos roles con cuentas separadas (`mobile/types/user.ts`):

- **Vecino:** reporta, confirma y sigue reclamos. Se registra escaneando el **PDF417** del
  dorso del DNI con la cámara; no escribe sus datos a mano.
- **Admin (municipio):** gestiona los reclamos de su municipio. No se registra desde la app:
  existe como dato de prueba del backend (`prisma/data/usuarios-admin.json` en pozo-backend). Hoy hay un solo municipio
  (CABA).

Según el rol, la sesión abre un grupo de tabs distinto: `(tabs)` para el vecino y `(admin)`
para el municipio.

## Estados del reclamo

```
Reportado → ConfirmadoPorVecinos → EnviadoAlMunicipio → EnReparacion → Resuelto
                  (cualquiera de los anteriores, salvo los finales) → Rechazado
   (cualquiera de los abiertos, con 10 votos "Ya no está") → Resuelto
```

| Estado | Quién lo produce | Cuándo |
|---|---|---|
| Reportado | Vecino | Al publicar |
| Confirmado por vecinos | Automático | Al juntar **1 confirmación** de otro vecino (el autor no cuenta) |
| Enviado al municipio (en la app: "Tomado por el municipio") | Municipio | Lo toma (acción **Tomar**); se le asigna sola el área de su categoría |
| En reparación | Municipio | Pasa a reparación; exige la **fecha estimada** (no anterior a hoy) |
| Resuelto | Municipio, o los vecinos | El municipio exige la **foto del "después"**. Los vecinos lo resuelven solos con **10 votos "Ya no está"**, sin foto |
| Rechazado | Municipio | Exige un **motivo de la lista** ("No corresponde al municipio", "No requiere arreglo", "Duplicado"), con un detalle de texto opcional |

`Resuelto` y `Rechazado` son finales. Cada transición queda en el historial del reclamo con
fecha y descripción, y es lo que se muestra como línea de tiempo. Las reglas viven en
`mobile/lib/maquinaEstados.ts` como funciones puras.

### Categorías peligrosas

Poste caído, árbol o rama caída, corte de luz o agua y semáforo pueden pasar directo de
`Reportado` a `Enviado al municipio` sin esperar confirmaciones: son un riesgo inmediato.

## Categorías y áreas

Nueve categorías: pozo, vereda, semáforo, luminaria, poste, árbol o rama caída, zanja,
luz/agua y residuos. Cada una pertenece a **un área** del municipio
(`prisma/data/areas.json` en pozo-backend). El área se asigna sola al tomar el reclamo y es
interna: solo la usa el gráfico por área del tablero.

| Área | Categorías |
|---|---|
| Alumbrado | Luminaria, poste |
| Bacheo y veredas | Pozo, vereda |
| Arbolado | Árbol o rama caída |
| Semáforos y tránsito | Semáforo |
| Higiene urbana | Residuos |
| Servicios públicos | Luz/agua, zanja |

## Severidad

El vecino elige **Baja, Media o Alta** al reportar. No cambia el estado; suma poco a la
prioridad (ver abajo).

Las decisiones detrás de prioridad, atraso, duplicados y registro están explicadas en
[decisiones.md](decisiones.md).

## Prioridad y atraso (municipio)

La bandeja ordena por la severidad que eligió el vecino y, dentro de cada nivel, por una
**prioridad** que calcula el servidor en cada respuesta, no se guarda (`pozo-backend`,
`src/domain/prioridad.ts`). La severidad y la categoría no suman a la prioridad:

- +10 por cada confirmación.
- −10 por cada voto "Ya no está" (nunca queda negativa).
- +2 por cada día desde que se creó.

El número no se muestra. En su lugar cada fila de la bandeja lleva un **indicador de
severidad** (ícono de alerta de tres colores) y la bandeja ordena primero los rojos, después
los naranjas y por último los verdes. La categoría peligrosa no cambia el color ni el orden;
solo permite al municipio tomar el reclamo sin esperar confirmaciones:

- **Alta** (rosa): severidad Alta.
- **Media** (naranja): severidad Media.
- **Baja** (verde): severidad Baja.

Un reclamo está **atrasado** cuando tiene fecha estimada, esa fecha ya pasó y todavía no está
cerrado. La fecha solo se define en `En reparación`, así que en la práctica solo se atrasan
los reclamos en reparación. Se muestra en la bandeja, en el detalle (junto a la fecha) y en el
tablero, no en el mapa.

## Pantallas

### Ingreso

- **Ingresar:** email y contraseña.
- **Crear cuenta:** escaneo del PDF417 del DNI y datos de acceso. Si el DNI ya tiene cuenta,
  se avisa apenas se escanea y se ofrece ir a iniciar sesión.

### Vecino

| Pantalla | Comportamiento |
|---|---|
| Mapa | Todos los reclamos con filtros por categoría y estado. Los cercanos se agrupan en un círculo con la cantidad. Panel **"Cerca tuyo"**: reclamos activos a menos de 500 m, del más cercano al más lejano. |
| Nuevo reclamo | Foto con la cámara (solo en vivo, sin galería), ubicación por GPS, categoría, severidad y notas. Si ya hay un reclamo abierto de la misma categoría a menos de 50 m, el servidor no lo publica y la app lo muestra para confirmarlo en lugar de duplicarlo (o publicar igual si es otro problema). Al publicar se genera el número de expediente. |
| Detalle | Foto, mapa, dirección, barrio, expediente, días abierto, votos **"Sigue ahí" / "Ya no está"** y línea de tiempo. Con el reclamo resuelto muestra el antes y el después. |
| Reclamos | Lista de todos los reclamos, con filtro por estado y "Solo míos" (los que reportó la persona). |
| Barrio | Estadísticas del barrio (porcentaje resuelto, total, días promedio, posición entre los barrios, reclamos por categoría y evolución de 6 meses). |
| Perfil | Datos personales (DNI enmascarado) y cerrar sesión. |

### Municipio

| Pantalla | Comportamiento |
|---|---|
| Bandeja | Tres segmentos (Nuevos: Reportado y Confirmado, En gestión, Cerrados), búsqueda por dirección y filtros por barrio, comuna y categoría. Orden por semáforo de peligrosidad y, dentro de cada nivel, por puntaje. Chip de atrasado. |
| Mapa | Los mismos filtros más **Sección** (Nuevos / En gestión / Cerrados), que solo está en el mapa. Los pines se pintan según la sección (Nuevos mandarina, En gestión cobalto, Cerrados lima) y la leyenda muestra esos tres colores. Los cerrados son los de los últimos 7 días. Una tarjeta abre el detalle. |
| Tablero | Reclamos abiertos que requieren seguimiento, nuevos sin tomar, atrasados (fecha estimada vencida), porcentaje resuelto, días promedio, reclamos por área y por estado. |
| Detalle con gestión | Las acciones dependen del estado. Nuevos (Reportado, Confirmado): **Tomar** (solo si está confirmado o es peligroso) y **Rechazar**. Tomado por el municipio: **Pasar a reparación** (en el mismo paso se elige la fecha estimada) y **Rechazar**. En reparación: **Cambiar fecha**, **Resuelto** (pide la foto del después, con la cámara) y **Rechazar**; si la fecha ya pasó, el detalle muestra "Atrasado" junto a ella. Cerrados: sin acciones; se ve el motivo del rechazo o que lo resolvieron los vecinos. Notas públicas del expediente. |
| Perfil | Datos del admin y del municipio. |

## Votos "Sigue ahí" / "Ya no está"

Los vecinos confirman que un reclamo sigue ahí o avisan que ya no está. Un vecino está en una
lista o en la otra, nunca en las dos. Si hay **3 o más** "Ya no está" y más que "Sigue ahí",
el reclamo se marca como **posiblemente resuelto** (`mobile/lib/verificacion.ts`). Al llegar a
**10** "Ya no está", un reclamo abierto pasa solo a `Resuelto` y queda en el historial como
"Resuelto por los vecinos: el problema ya no está (se resolvió y el municipio todavía no lo
actualizó)". Cuenta como resuelto en las estadísticas.

## Origen de la ubicación de una foto

Las fotos se sacan **dentro de la app**, con la cámara en vivo: se piden las coordenadas al
disparar. Cada reclamo guarda de dónde salió su ubicación (`locationSource`), que hoy siempre
es `Device` (GPS del dispositivo al sacar la foto). El servidor todavía acepta `Exif` y
`Manual` (de cuando se podía elegir de la galería), pero la app ya no los manda.

## Reglas de negocio

1. Un vecino no puede confirmar dos veces el mismo reclamo ni confirmar el propio.
2. Un reclamo necesita foto y coordenadas para publicarse.
3. El vecino no escribe la ubicación a mano: sale del GPS del dispositivo al sacar la foto.
4. "Cerca tuyo" lista reclamos activos a menos de 500 m, ordenados por distancia.
5. Solo el municipio mueve un reclamo de `Confirmado por vecinos` en adelante.
6. Resolver exige foto del "después"; rechazar exige un motivo de la lista; pasar a reparación exige la fecha estimada, que no puede ser anterior a hoy y solo se cambia mientras se repara.
7. Un reclamo cerrado (`Resuelto` o `Rechazado`) no cambia más de estado.

## Fuera de alcance por ahora

Backend real y base de datos del municipio, notificaciones push, varios municipios,
almacenamiento de fotos en un servidor y modo sin conexión. Ver "Próximos pasos" en el
[README](../README.md#próximos-pasos).
