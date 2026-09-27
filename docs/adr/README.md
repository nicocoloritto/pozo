# Architecture Decision Records

Una decisión técnica que cueste revertir se escribe acá. Dentro de tres meses nadie se va a
acordar por qué elegimos lo que elegimos, y sin el registro la discusión se repite entera.

Numerá secuencialmente: `0001-titulo-corto.md`.

## Decisiones tomadas y todavía sin registrar

- **0001** — `expo-router` para la navegación, en vez de React Navigation "a mano". Las
  tareas de la materia ya usaron `expo-router`, que corre sobre React Navigation.
- **0002** — Expo (managed) en vez de React Native CLI: cámara, ubicación y mapas vienen
  integrados y no hace falta Android Studio.
- **0003** — SQLite + Prisma en el backend, sin migrar a Postgres. El límite: SQLite es un
  archivo, así que el backend corre local (o en un disco persistente) durante la defensa.
- **0004** — La elevación a la comuna (50 confirmaciones) es automática; a partir de ahí, el
  cambio de estado lo hace el rol **Municipalidad**, una cuenta real de la app, no una
  simulación externa.
- **0005** — Código en inglés, texto de pantalla en español, sin i18n.
- **0006** — Dos roles de `User` (`Neighbor` y `Municipality`). El vecino se registra
  escaneando el PDF417 del DNI en vez de un formulario; la municipalidad, con email y
  contraseña. No se guarda el número de documento en texto plano.
- **0007** — "Urgente" es una etiqueta calculada (severidad Alta + validado), no un cuarto
  nivel de `Severity` que elige el vecino.

## Plantilla

```markdown
# ADR-XXXX: <decisión>

- **Estado:** propuesta | aceptada | reemplazada por ADR-YYYY
- **Fecha:** AAAA-MM-DD

## Contexto
Qué problema había y qué restricciones teníamos.

## Decisión
Qué elegimos.

## Alternativas descartadas
Qué otras opciones vimos y por qué no.

## Consecuencias
Qué se vuelve más fácil, qué más difícil, qué deuda queda.
```
