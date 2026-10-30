# yeyo.games

Hub de minijuegos para navegador (Astro + Tailwind), publicado en https://yeyo.games con el
proyecto `yeyo-games` de Vercel. La integración Git está prevista para publicar `main` y generar
vistas previas de las demás ramas; el resultado de cada despliegue se comprueba en Vercel.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # compila a dist/
```

- Catálogo de juegos: `src/data/games.ts`. Portada: `src/pages/index.astro`, una tele CRT con la
  pantalla de selección de personaje de Marvel vs. Capcom 2 (versión de consola): un globo con
  5 × 4 celdas (`src/scripts/globo.ts`, canvas de 640 × 480 escalado), los juegos en el orden del
  catálogo y las celdas sobrantes bloqueadas con «?». Varios detalles salen del decomp del juego
  para PS2 (`g-guthrie/mvc2-ps2-decomp`): la paleta de la rejilla, el anillo de 32 objetos, el
  desplazamiento de la escena según qué jugadores están, la entrada volando de los retratos y la
  animación del cursor; las constantes están comentadas al inicio de `globo.ts`. A la izquierda,
  el retrato y las figuras del juego elegido y la banda con su nombre; el mapa `ARTE` de
  `src/scripts/hub.ts` asigna la presentación de cada juego. Se maneja
  con flechas/WASD y Enter, clic o toque en una celda (dos veces confirma), deslizando en táctil o
  con mando (A confirma, Start abre el lado del jugador 2, B lo cierra).
- Arranque: la tele empieza apagada con «PRESS START BUTTON»; cualquier tecla, botón o toque la
  enciende (eso desbloquea el audio), suena el encendido y aparece el globo. El efecto CRT
  (curvatura, scanlines, viñeta, separación RGB, parpadeo) es CSS sobre la pantalla.
- Música: el menú reproduce en bucle `public/audio/select.mp3` (o `.ogg`) si existe; el archivo
  está en el repositorio (la pista es © Capcom) y sin él el menú va en silencio. Los demás
  sonidos se sintetizan en `src/scripts/audio.ts`.
- Cuenta: el lado del jugador 2. «PRESS START BUTTON» (o Tab, o Start en el mando) abre el
  formulario de crear/entrar; `src/lib/account.ts` aún no tiene servicio detrás y responde
  `sin-servicio`, que se muestra como «?».
- **Dead Zone** no vive aquí: `vercel.json` pasa `/deadzone/` al proyecto `deadzone`
  (repositorio `leolv7354841-crypto/Juego--safari`), así que siempre muestra su última versión.
- **Perrones** tiene su casilla y arte propio en el selector. `/perrones/` redirige a
  https://perrones.vercel.app/, donde vive el juego y su cooperativo por código de sala.
  Mantener ese destino conserva el origen de las partidas guardadas y el servidor online
  configurado. El selector coloca a los cuatro hermanos (bulldog inglés, francés, pug y basset)
  en una diagonal compacta, con movimientos individuales y entrada escalonada al cambiar de
  selección. Dead Zone presenta a su zombi como una figura grande.
- Los retratos y modelos del selector son originales generados con la herramienta integrada
  de imágenes de Codex, con los perros de Perrones como referencia de identidad y el arcade
  de pelea de los 90–2000 como referencia visual. Los cinco atlas de retratos y las cinco hojas
  de animación en reposo (`*-idle.webp`) viven en `public/art/`;
  `src/scripts/arcade-art.ts` los prepara una vez para canvas. Cada hoja idle contiene seis
  poses en dos columnas por tres filas: 30 cuadros en total, en hojas de 1024 × 1536 píxeles.
  Los cuadros se registran por el apoyo de una pata y mantienen una escala común por personaje
  para evitar cambios de tamaño al avanzar la secuencia. Las cinco hojas idle suman 1,81 MB
  adicionales (1.811.206 bytes). No se cambia el
  arte del juego ni se copian personajes o logotipos de Marvel/Capcom. `public/art/provenance.json`
  conserva herramienta, referencias y prompts de los atlas; `public/art/idle-provenance.json`
  registra los de las hojas idle y su codificación WebP. Aplican los
  [términos de OpenAI](https://openai.com/policies/terms-of-use/). Con movimiento reducido,
  las figuras permanecen en el primer cuadro y aparecen sin entrada animada. El botón
  «ANIMACIÓN» permite elegir movimiento y recuerda esa elección en este navegador; sin
  elección propia, sigue la preferencia del sistema. Si falla una
  descarga, se conserva el arte local de respaldo de `sprites.ts` y `perrones.ts`.
- Supabase (opcional): `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY` en las variables de
  entorno de Vercel o en un `.env` local (ver `.env.example`).

**Autoría y despliegue.** Los commits conservan la identidad real de quien los crea. Configura
`git user.name` y `git user.email` con tu propia identidad, sin usar la de otra persona para
eludir restricciones de publicación. Si Vercel bloquea un despliegue, revisa el motivo y los
permisos, la integración y el plan del equipo con su dueño. Un push o una fusión no confirman
por sí solos que la revisión esté publicada.
