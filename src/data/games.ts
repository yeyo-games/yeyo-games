export type Game = {
  slug: string;
  title: string;
  href: string;
  status: 'live' | 'soon';
};

// Las celdas del globo del menú siguen este orden (5 columnas × 4 filas); las que sobran quedan
// bloqueadas. El arte de cada juego está en `src/scripts/hub.ts` (ARTE), por slug.
export const games: Game[] = [
  { slug: 'deadzone', title: 'Dead Zone', href: '/deadzone/', status: 'live' },
  { slug: 'perrones', title: 'Perrones', href: '/perrones/', status: 'live' },
];
