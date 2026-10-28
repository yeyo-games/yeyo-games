export type Game = {
  slug: string;
  title: string;
  href: string;
  status: 'live' | 'soon';
};

// Cada juego ocupa una cara del cubo del menú (arriba, izquierda, derecha, en ese orden).
// La cara de abajo es la cuenta.
export const games: Game[] = [
  { slug: 'deadzone', title: 'Dead Zone', href: '/deadzone/', status: 'live' },
  { slug: 'proximamente', title: 'Próximamente', href: '#', status: 'soon' },
];
