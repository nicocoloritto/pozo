# Sprint 1 — FrontEnd, aplicación con React Native

Enunciado de la cátedra (Ing. Ignacio Parravicini e Ing. Martín Buzzetti, UCA). Original en
`Sprint 1 - Consignas.pdf`. **Entrega: 15/10/2026 a las 18hs (UTC-3).**

Se transcribe lo esencial sin reinterpretar. La interpretación vive en
[`sprint-1-backlog.md`](sprint-1-backlog.md).

## 1. Consignas

Presentar el proyecto con un fuerte enfoque en la **viabilidad técnica de los componentes
nativos**, cubriendo:

### 1.1 Temática de la aplicación
- Descripción del problema, contexto y qué buscan resolver.
- Público objetivo: quiénes la usarán.
- Diferencial frente a la competencia.
- Modelo de negocio, financiamiento o impacto: cómo será sostenible en el tiempo.

### 1.2 Branding
- Nombre de la aplicación.
- Paleta de colores (con códigos HEX).
- Tipografías.
- Isotipo, logotipo, imagotipo o isologo.

### 1.3 Mockup
Diseños de pantallas (wireframes o prototipo interactivo) con información estática, hechos
con una herramienta vista en clase (Figma, Adobe XD o similar). **Debe mostrar los flujos de
navegación.** Se puede modificar estéticamente el mockup o el flujo, siempre que no se
eliminen funcionalidades del proyecto propuesto.

### 1.4 Componentes nativos
Selección, integración y uso de **al menos 2 componentes nativos** del dispositivo, con
justificación. **El uso de terminología técnica es obligatorio.** Ejemplos: GPS/geolocalización,
cámara, giroscopio, acelerómetro, fototeca, podómetro, notificaciones push, biometría.

### 1.5 Desarrollo
Expo inicializado, router configurado, navegación funcionando e implementación del FrontEnd
de los componentes y pantallas según el mockup presentado. Sin backend todavía: la
funcionalidad puede estar incompleta o con información estática.

## 2. Formato de entrega

**Un único PDF** que aborde los criterios anteriores, con:
- la **URL del mockup** (enlace público al prototipo interactivo), y
- la **URL del repositorio** (enlace público del FrontEnd).

Ambas URLs deben ser **públicas** para que el cuerpo docente las evalúe.

## 3. Criterios de evaluación

Se aprueba con nivel **bueno o superior** en cada criterio.

| Criterio | Excelente | Bueno | Insuficiente |
|---|---|---|---|
| **3.1 Propuesta de valor y negocio** | Problema preciso, propuesta clara, público con segmentación/arquetipo y estrategia de monetización o sustentabilidad | Problema y público identificados, pero propuesta genérica o sin diferencial; enfoque comercial poco desarrollado | Sin problema real, público "para todo el mundo", sin noción de sustento |
| **3.2 Temática y branding** | Problema, solución y público claros; branding (nombre, logo, HEX, tipografías) coherente y aplicado en el mockup | Branding inconsistente (ej. los colores del branding no coinciden con los del mockup o del desarrollo) | Temática vaga; sin paleta, tipografías ni criterio de diseño |
| **3.3 Mockup y navegación** | Prototipo nítido, flujo intuitivo, buenos espacios entre componentes y entre los 2 nativos | Pantallas completas pero flujo confuso o interfaz poco clara | Bocetos incompletos, a mano o que no cubren las funcionalidades |
| **3.4 Componentes nativos** | ≥2 nativos con justificación técnica clara y comprensión de cómo interactúan con la UX | Los 2 elegidos, pero justificación superficial o uno se percibe "forzado" | Menos de 2, alguno no es nativo, o sin justificación técnica |
| **3.5 Presentación y aspectos técnicos** | PDF único, excelente redacción y ortografía, URLs funcionando y públicas | Fallas menores de organización u ortografía, o URLs que no funcionan / sin permisos públicos | Formato incorrecto, criterios faltantes o documento ilegible |

## Interpretación nuestra

Ver el backlog. Puntos que conviene no perder de vista:

- El criterio 3.2 penaliza que **los colores del branding no coincidan con los del mockup o
  del desarrollo**. Por eso los colores viven en un solo lugar (`mobile/theme/`).
- El mockup tiene que estar en **Figma o similar con enlace público**. Los HTML de `design/`
  son la referencia de diseño, pero no son un prototipo de Figma.
- El repositorio tiene que ser **público**: nada de secretos ni `.env` versionados.
