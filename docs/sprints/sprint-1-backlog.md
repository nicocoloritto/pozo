# Backlog del Sprint 1

Lo que nos comprometemos a entregar de la [consigna del Sprint 1](sprint-1.md).
**Entrega: jueves 15 de octubre de 2026, 18hs.** Es un sprint de **FrontEnd**: no hay backend
ni persistencia todavía, los datos son estáticos.

## Cómo escribimos las stories

> **Como** <rol concreto> · **quiero** <capacidad> · **para** <valor que obtiene>

Acá el "rol" es a veces el equipo o el docente que evalúa, porque buena parte del sprint es
documentación. Lo que importa son los **criterios de aceptación**:

1. Se escriben **antes** de construir.
2. Cada uno se responde con **sí o no**.
3. Se verifican **usando la app o el PDF**, sin abrir el código.
4. Dicen el **qué**, no el cómo.
5. Sin términos vagos: con números.
6. Cubren también **lo que sale mal** (permiso denegado, lista vacía).

## Stories

### US-01 · Propuesta de valor y negocio (consigna 1.1 · criterio 3.1)
**Como** docente evaluador, **quiero** entender qué problema resuelve Pozo y para quién,
**para** juzgar si es relevante y sostenible.

- [x] El PDF describe el problema con contexto concreto (CABA, reclamos urbanos), no genérico.
- [x] Define al menos **un arquetipo de usuario** con nombre, edad, situación y necesidad.
- [x] Nombra **al menos dos competidores o alternativas** existentes (ej. BA Elige, 147) y
      dice en qué se diferencia Pozo.
- [x] Propone una estrategia de sustento concreta (ej. convenios, valor social, freemium).

### US-02 · Branding (consigna 1.2 · criterio 3.2)
**Como** equipo, **queremos** una identidad de marca definida, **para** que mockup y app se
vean iguales.

- [x] Nombre definido: **Pozo**.
- [x] Paleta con **códigos HEX**, coincidente con la del mockup y con `mobile/theme/`.
- [x] Tipografías definidas (Archivo Black, Inter, IBM Plex Mono) y usadas en el mockup y en la app.
- [x] Existe un isotipo/imagotipo/isologo, y el PDF dice cuál es de los cuatro tipos.
- [x] Ningún color de la app está escrito fuera de `mobile/theme/`.
- [x] Las tipografías Archivo Black, Inter e IBM Plex Mono se ven en la app (cargadas con
      `expo-font`).

### US-03 · Mockup interactivo en Figma (consigna 1.3 · criterio 3.3)
**Como** docente evaluador, **quiero** recorrer el prototipo con un enlace, **para** ver los
flujos sin instalar nada.

- [x] El prototipo está en **Figma** y su enlace se abre **sin iniciar sesión**.
- [x] Muestra al menos estos flujos navegables: onboarding → mapa; mapa → detalle; "+" →
      nuevo reclamo → publicar; Mis reclamos; Ranking.
- [ ] Las pantallas del mockup coinciden con las de la app (branding consistente).
- [x] La pantalla "Nuevo reclamo" muestra el uso de cámara y de ubicación, con sus permisos.
- [x] Ningún botón del prototipo lleva a una pantalla inexistente.
- [x] Los HTML de `design/` son referencia visual; el prototipo navegable que se entrega es
      el de Figma, no los HTML.

### US-04 · Componentes nativos y justificación (consigna 1.4 · criterio 3.4)
**Como** equipo, **queremos** justificar técnicamente por qué usamos cámara y GPS,
**para** demostrar que no están "forzados".

- [ ] El PDF elige **al menos 2** componentes nativos: **cámara** y **GPS/geolocalización**.
- [ ] Cada uno explica con terminología técnica: permiso solicitado, API de Expo usada,
      dato que produce (ej. coordenadas WGS84, precisión) y cómo se usa en el flujo.
- [ ] Explica qué pasa si el usuario **rechaza** el permiso.
- [ ] Explica cómo interactúan entre sí en "Nuevo reclamo" (foto + coordenadas = evidencia).

### US-05 · App inicial con navegación (consigna 1.5)
**Como** vecino, **quiero** moverme entre las pantallas de Pozo, **para** ver cómo va a ser la app.

- [ ] La app corre en Expo Go en un celular, sin errores al abrir.
- [ ] Hay una barra de tabs con Mapa, Barrio, "+", Mis reclamos y Perfil.
- [ ] Desde el feed puedo abrir el detalle de un reclamo y volver.
- [ ] "+" abre "Nuevo reclamo" y "Cancelar" vuelve a donde estaba.
- [ ] Las 6 pantallas del mockup existen y muestran datos estáticos con el aspecto del mockup.
- [ ] Las listas son `FlatList` con datos de ejemplo; una lista vacía muestra un mensaje.
- [ ] La tab bar tiene íconos.
- [ ] Ninguna pantalla muestra textos de placeholder (ej. "Fuera del alcance"); Perfil
      muestra datos estáticos.

### US-06 · Cámara y ubicación funcionando (refuerza 1.4 y 1.5)
**Como** vecino, **quiero** sacar la foto y ver mi ubicación en "Nuevo reclamo", **para**
comprobar que los componentes nativos funcionan de verdad.

- [ ] La app pide permiso de cámara y de ubicación la primera vez que se necesitan.
- [ ] Puedo sacar una foto y verla en la pantalla.
- [ ] Veo mis coordenadas actuales en la pantalla.
- [ ] Si rechazo un permiso, veo un mensaje que explica qué se pierde; la app no se cierra.
- [ ] "Publicar" queda deshabilitado sin foto, categoría o severidad.

### US-07 · Entrega (consigna 2 · criterio 3.5)
**Como** equipo, **queremos** entregar el PDF y los enlaces sin errores, **para** no perder
puntos por formato.

- [ ] Es **un único PDF** que cubre 1.1 a 1.5 en ese orden.
- [ ] Incluye capturas de pantalla de la app corriendo.
- [ ] Incluye la URL del mockup y la del repositorio.
- [ ] Ambas URLs se abren en una **ventana de incógnito** sin iniciar sesión.
- [ ] El repositorio es **público** y no contiene `.env` ni secretos.
- [ ] Al menos dos integrantes revisaron ortografía y redacción.

## Orden sugerido y fechas

Hoy es 23/9; quedan ~22 días.

| Cuándo | Qué |
|---|---|
| Hasta el 24/9 | Repo público en GitHub; US-02 (branding: logo y paleta finales) |
| Hasta el 1/10 | US-03 (Figma) en paralelo con la inicialización de Expo (US-05, tabs vacías) |
| Hasta el 8/10 | US-05 (pantallas con datos estáticos) y US-01 (texto de negocio) |
| Hasta el 12/10 | US-06 (cámara y GPS), US-04 (justificación técnica) |
| 13 y 14/10 | US-07: armar el PDF, revisar entre los 3 y probar los enlaces |
| **15/10 18hs** | **Entrega** (apuntar a subir el 14/10, no el mismo día) |
