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
  existe como dato de prueba (`mobile/data/usuarios-admin.json`). Hoy hay un solo municipio
  (CABA).

Según el rol, la sesión abre un grupo de tabs distinto: `(tabs)` para el vecino y `(admin)`
para el municipio.

## Estados del reclamo

```
Reportado → ConfirmadoPorVecinos → EnviadoAlMunicipio → EnReparacion → Resuelto
                  (cualquiera de los anteriores, salvo los finales) → Rechazado
```

| Estado | Quién lo produce | Cuándo |
|---|---|---|
| Reportado | Vecino | Al publicar |
| Confirmado por vecinos | Automático | Al juntar **3 confirmaciones** de otros vecinos |
| Enviado al municipio | Municipio | Lo toma (acción **Tomar**) |
| En reparación | Municipio | Pasa a reparación; exige tener un **área asignada** |
| Resuelto | Municipio | Exige la **foto del "después"** |
| Rechazado | Municipio | Exige un **motivo** |

`Resuelto` y `Rechazado` son finales. Cada transición queda en el historial del reclamo con
fecha y descripción, y es lo que se muestra como línea de tiempo. Las reglas viven en
`mobile/lib/maquinaEstados.ts` como funciones puras.

### Categorías peligrosas

Poste caído, árbol o rama caída, corte de luz o agua y semáforo pueden pasar directo de
`Reportado` a `Enviado al municipio` sin esperar confirmaciones: son un riesgo inmediato.

## Categorías y áreas

Nueve categorías: pozo, vereda, semáforo, luminaria, poste, árbol o rama caída, zanja,
luz/agua y residuos. Cada una pertenece a **un área** del municipio, y cada área tiene un
**plazo máximo** en días (`mobile/data/areas.json`):

| Área | Categorías | Plazo |
|---|---|---|
| Alumbrado | Luminaria, poste | 7 días |
| Bacheo y veredas | Pozo, vereda | 15 días |
| Arbolado | Árbol o rama caída | 10 días |
| Semáforos y tránsito | Semáforo | 5 días |
| Higiene urbana | Residuos | 3 días |
| Servicios públicos | Luz/agua, zanja | 7 días |

## Severidad

El vecino elige **Baja, Media o Alta** al reportar. Es un dato informativo; no cambia el
estado por sí sola.

## Prioridad y vencimiento (municipio)

La bandeja ordena por una **prioridad** calculada, no guardada (`mobile/lib/prioridad.ts`):

- +10 por cada confirmación.
- −10 por cada voto "Ya no está" (nunca queda negativa).
- +2 por cada día de antigüedad.
- +50 si la categoría es peligrosa.

Un reclamo está **vencido** cuando el municipio ya lo tomó (`Enviado al municipio` o `En
reparación`) y pasaron más días que el plazo de su área. Si todavía no tiene área, se usa el
plazo más corto de todas. Antes de ser tomado, o una vez cerrado, no corre plazo.

## Pantallas

### Ingreso

- **Ingresar:** email y contraseña.
- **Crear cuenta:** escaneo del PDF417 del DNI y datos de acceso.

### Vecino

| Pantalla | Comportamiento |
|---|---|
| Mapa | Todos los reclamos con filtros por categoría y estado. Los cercanos se agrupan en un círculo con la cantidad. Panel **"Cerca tuyo"**: reclamos activos a menos de 500 m, del más cercano al más lejano. |
| Nuevo reclamo | Foto con la cámara (o galería), ubicación por GPS, categoría, severidad y notas. Si ya hay un reclamo abierto de la misma categoría a menos de 50 m, lo muestra y deja confirmarlo en lugar de duplicarlo. Al publicar se genera el número de expediente. |
| Detalle | Foto, mapa, dirección, barrio, expediente, días abierto, votos **"Sigue ahí" / "Ya no está"** y línea de tiempo. Con el reclamo resuelto muestra el antes y el después. |
| Mis reclamos | Lista de los propios, con filtro por estado. |
| Barrio | Estadísticas del barrio (porcentaje resuelto, total, días promedio, posición entre los barrios, reclamos por categoría y evolución de 6 meses). |
| Perfil | Datos personales (DNI enmascarado) y cerrar sesión. |

### Municipio

| Pantalla | Comportamiento |
|---|---|
| Bandeja | Tres segmentos (Nuevos, En gestión, Cerrados), búsqueda por dirección y filtros por barrio, comuna, categoría y área. Orden por prioridad y marca de vencido. |
| Mapa | Los mismos filtros, con marca visual para vencidos y peligrosos y una tarjeta que abre el detalle. |
| Tablero | Reclamos abiertos que requieren seguimiento, nuevos sin tomar, vencidos, porcentaje resuelto, días promedio, reclamos por área y por estado. |
| Detalle con gestión | Acciones: **Tomar, Asignar área, Fecha estimada, Pasar a reparación, Resolver, Rechazar**. Notas públicas del expediente. |
| Perfil | Datos del admin y del municipio. |

## Votos "Sigue ahí" / "Ya no está"

Los vecinos confirman que un reclamo sigue ahí o avisan que ya no está. Un vecino está en una
lista o en la otra, nunca en las dos. Si hay **3 o más** "Ya no está" y más que "Sigue ahí",
el reclamo se marca como **posiblemente resuelto** (`mobile/lib/verificacion.ts`).

## Origen de la ubicación de una foto

Una foto sacada **dentro de la app** siempre es confiable: se piden las coordenadas al
disparar. Una foto de la **galería** puede traer coordenadas EXIF, o no traer ninguna. Por eso
cada reclamo guarda de dónde salió su ubicación (`locationSource`):

- `Device`: GPS del dispositivo al sacar la foto (el más confiable).
- `Exif`: coordenadas leídas del archivo de la foto elegida en la galería.
- `Manual`: no había coordenadas; se usó la ubicación actual del vecino.

## Reglas de negocio

1. Un vecino no puede confirmar dos veces el mismo reclamo ni confirmar el propio.
2. Un reclamo necesita foto y coordenadas para publicarse.
3. El vecino no escribe la ubicación a mano: sale del GPS o del EXIF de la foto.
4. "Cerca tuyo" lista reclamos activos a menos de 500 m, ordenados por distancia.
5. Solo el municipio mueve un reclamo de `Confirmado por vecinos` en adelante.
6. Resolver exige foto del "después"; rechazar exige motivo; pasar a reparación exige área.
7. Un reclamo cerrado (`Resuelto` o `Rechazado`) no cambia más de estado.

## Fuera de alcance por ahora

Backend real y base de datos del municipio, notificaciones push, varios municipios,
almacenamiento de fotos en un servidor y modo sin conexión. Ver "Próximos pasos" en el
[README](../README.md#próximos-pasos).
