export type Game = {
  slug: string;
  title: string;
  tagline: string;
  tags: string[];
  href: string;
  engine: 'Vanilla JS' | 'Phaser';
  status: 'live' | 'soon';
  accent: string;
};

export const games: Game[] = [
  {
    slug: 'deadzone',
    title: 'Dead Zone',
    tagline: 'Supervivencia zombi 2D. Hordas, barricadas, torretas y un zombi dorado que no quieres dejar escapar.',
    tags: ['Supervivencia', 'Zombis', 'Coop', 'Móvil'],
    href: '/deadzone/',
    engine: 'Vanilla JS',
    status: 'live',
    accent: '#b6f23c',
  },
  {
    slug: 'proximamente',
    title: 'Próximamente',
    tagline: 'El siguiente minijuego en Phaser está en el horno.',
    tags: ['Phaser'],
    href: '#',
    engine: 'Phaser',
    status: 'soon',
    accent: '#52525b',
  },
];
