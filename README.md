# yeyo.games

Hub de minijuegos para navegador (Astro + Tailwind), publicado en https://yeyo.games con el
proyecto `yeyo-games` de Vercel. Cada push a `main` se publica en producción; las demás ramas
generan una vista previa.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # compila a dist/
```

- Catálogo de juegos: `src/data/games.ts`. Portada: `src/pages/index.astro`, un menú tipo consola:
  un cubo de cristal con los juegos en las caras de arriba, izquierda y derecha (en el orden del
  catálogo) y la cuenta abajo. Se maneja con flechas/WASD, clic en las etiquetas, deslizando en
  táctil o con mando (A confirma, B vuelve; Esc o Retroceso vuelven en teclado).
- Arranque: `src/scripts/boot.ts` dibuja la «y» con cubitos y mete el cubo girando; el sonido se
  sintetiza en `src/scripts/audio.ts` (sin archivos de audio). Si el navegador bloquea el audio
  hasta un gesto, la página espera en negro con el LED de encendido y arranca con cualquier tecla
  o toque. Cualquier tecla o toque durante el arranque lo salta. Con «reducir movimiento» no hay
  animación, sólo el sonido.
- Cuenta: `src/lib/account.ts` es el sitio para crear cuenta y entrar. Aún no hay servicio detrás,
  así que responde `sin-servicio` y la cara del cubo muestra el anillo de «?».
- **Dead Zone** no vive aquí: `vercel.json` pasa `/deadzone/` al proyecto `deadzone`
  (repositorio `leolv7354841-crypto/Juego--safari`), así que siempre muestra su última versión.
- Supabase (opcional): `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY` en las variables de
  entorno de Vercel o en un `.env` local (ver `.env.example`).

**Autor de los commits.** El repositorio es privado y el equipo de Vercel está en el plan
Hobby: Vercel sólo publica commits cuyo autor sea el dueño (`leolv7354841-crypto`); los de otra
cuenta quedan «Blocked». Por eso este clon tiene configurado `git config user.name/user.email`
con la cuenta de Leo. En otro equipo, configúralo igual antes de hacer commit, o haz el
repositorio público, o pasa el equipo de Vercel a Pro y añade a los demás como miembros.
