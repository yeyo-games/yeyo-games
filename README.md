# yeyo.games

Hub de minijuegos para navegador (Astro + Tailwind), publicado en https://yeyo.games con el
proyecto `yeyo-games` de Vercel. Cada push a `main` se publica en producción; las demás ramas
generan una vista previa.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # compila a dist/
```

- Catálogo de juegos: `src/data/games.ts`. Portada: `src/pages/index.astro`.
- **Dead Zone** no vive aquí: `vercel.json` pasa `/deadzone/` al proyecto `deadzone`
  (repositorio `leolv7354841-crypto/Juego--safari`), así que siempre muestra su última versión.
- Supabase (opcional): `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY` en las variables de
  entorno de Vercel o en un `.env` local (ver `.env.example`).
