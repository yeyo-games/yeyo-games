# yeyo.games

Hub de minijuegos para navegador (Astro + Tailwind), publicado en https://yeyo.games con el
proyecto `yeyo-games` de Vercel. Cada push a `main` se publica en producción; las demás ramas
generan una vista previa.

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
  animación del cursor; las constantes están comentadas al inicio de `globo.ts`. A la izquierda, el retrato y el sprite del
  juego elegido y la banda con su nombre; el arte pixel se dibuja por código en
  `src/scripts/sprites.ts` (añade un juego nuevo en `ARTE`, en `src/scripts/hub.ts`). Se maneja
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
- Supabase (opcional): `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY` en las variables de
  entorno de Vercel o en un `.env` local (ver `.env.example`).

**Autor de los commits.** El repositorio es privado y el equipo de Vercel está en el plan
Hobby: Vercel sólo publica commits cuyo autor sea el dueño (`leolv7354841-crypto`); los de otra
cuenta quedan «Blocked». Por eso este clon tiene configurado `git config user.name/user.email`
con la cuenta de Leo. En otro equipo, configúralo igual antes de hacer commit, o haz el
repositorio público, o pasa el equipo de Vercel a Pro y añade a los demás como miembros.
