# Fotos de los reclamos de prueba

Faltan estos 19 archivos (JPG, lado mayor ~1000 px, **menos de 300 KB cada uno**).
Fotos reales de licencia libre (Unsplash o Pexels), una por línea, de la categoría indicada:

| Archivo | Reclamo | Qué tiene que mostrar |
|---|---|---|
| `pozo-1.jpg` | r1 (Caballito) | Pozo en el asfalto |
| `pozo-2.jpg` | r9 (Constitución) | Otro pozo, distinto al anterior (de preferencia con obra o conos) |
| `vereda-1.jpg` | r6 (Flores) | Vereda rota / baldosas levantadas |
| `semaforo-1.jpg` | r5 (Palermo) | Semáforo (apagado o dañado, si se consigue) |
| `luminaria-1.jpg` | r2 (Caballito) | Luminaria / farol de calle |
| `luminaria-2.jpg` | r10 (Palermo) | Otra luminaria, distinta a la anterior |
| `poste-1.jpg` | r11 (Boedo) | Poste caído o inclinado |
| `arbol-1.jpg` | r7 (La Boca) | Árbol o rama caída en la calle |
| `zanja-1.jpg` | r3 (Caballito) | Zanja abierta en la calle |
| `corte-luz-1.jpg` | r8 (Almagro) | Cables caídos / transformador / corte de luz |
| `residuos-antes.jpg` | r4 (Caballito) | Contenedor desbordado |
| `residuos-despues.jpg` | r4, foto de resolución | Contenedor y vereda limpios |
| `vereda-2.jpg` | r12 (Caballito) | Vereda rota, distinta a `vereda-1` |
| `semaforo-2.jpg` | r13 (Caballito) | Semáforo, distinto a `semaforo-1` |
| `arbol-2.jpg` | r14 (Parque Chacabuco) | Rama o árbol caído, distinto a `arbol-1` |
| `pozo-3.jpg` | r15 (Almagro) | Bache profundo, distinto a los otros dos |
| `luminaria-3.jpg` | r16 (Villa Crespo) | Luminarias apagadas, distintas a las otras |
| `luminaria-despues.jpg` | r16, foto de resolución | Luminaria encendida, el "después" |
| `corte-luz-2.jpg` | r17 (Caballito) | Cables o tablero eléctrico, distinto a `corte-luz-1` |

Pasos:

1. Copiar los archivos acá, con esos nombres exactos.
2. Descomentar la línea de cada uno en `index.ts`.
3. Anotar fuente, autor y licencia en `CREDITOS.md`.
4. En la app (modo desarrollo), Perfil → "Restablecer datos de prueba", para que los reclamos
   ya guardados en el teléfono tomen las fotos nuevas.

Mientras falten los archivos, la app muestra las fotos provisorias de `photoUrl` (picsum.photos),
que necesitan internet y no corresponden a la categoría.
