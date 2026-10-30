// Fallback pixel original del hub: Bulldog inglés de Perrones, sin imágenes externas.
const COLOR = {
  contorno: '#29212a',
  crema: '#f1e3c1',
  luz: '#fff3d6',
  sombra: '#cbb294',
  canela: '#a96948',
  oreja: '#754936',
  azul: '#388bb8',
  azulOscuro: '#235478',
  oro: '#f4c66c',
};

function lienzo(ancho: number, alto: number) {
  const c = document.createElement('canvas');
  c.width = ancho;
  c.height = alto;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.imageSmoothingEnabled = false;
  return { c, g };
}

function pixel(
  g: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  ancho = 1,
  alto = 1,
) {
  g.fillStyle = color;
  g.fillRect(x, y, ancho, alto);
}

function cara(g: CanvasRenderingContext2D, x: number, y: number) {
  const p = (color: string, a: number, b: number, w = 1, h = 1) =>
    pixel(g, color, x + a, y + b, w, h);

  // Cabeza cuadrada, orejas plegadas y parche canela alrededor de un ojo.
  p(COLOR.contorno, 4, 1, 8, 1);
  p(COLOR.contorno, 2, 2, 12, 10);
  p(COLOR.crema, 3, 3, 10, 8);
  p(COLOR.luz, 7, 3, 5, 3);
  p(COLOR.canela, 3, 3, 4, 5);
  p(COLOR.contorno, 1, 3, 3, 6);
  p(COLOR.contorno, 12, 3, 3, 6);
  p(COLOR.canela, 2, 3, 2, 5);
  p(COLOR.canela, 12, 3, 2, 5);
  p(COLOR.oreja, 2, 6, 1, 3);
  p(COLOR.oreja, 13, 6, 1, 3);
  p(COLOR.contorno, 4, 6, 3, 1);
  p(COLOR.contorno, 9, 6, 3, 1);
  p(COLOR.contorno, 5, 7);
  p(COLOR.contorno, 10, 7);

  // Hocico ancho y pesado, nariz corta y dos pequeños dientes inferiores.
  p(COLOR.contorno, 2, 9, 12, 3);
  p(COLOR.contorno, 3, 12, 10, 1);
  p(COLOR.sombra, 3, 9, 10, 3);
  p(COLOR.luz, 3, 9, 4, 2);
  p(COLOR.luz, 9, 9, 4, 2);
  p(COLOR.contorno, 6, 8, 4, 2);
  p(COLOR.contorno, 7, 10, 2, 1);
  p(COLOR.contorno, 5, 11, 6, 1);
  p(COLOR.luz, 5, 11);
  p(COLOR.luz, 10, 11);

  p(COLOR.contorno, 3, 13, 10, 2);
  p(COLOR.azul, 4, 13, 8, 1);
  p(COLOR.azulOscuro, 4, 14, 8, 1);
  p(COLOR.oro, 7, 14, 2, 1);
}

export function caraPerrones(): HTMLCanvasElement {
  const { c, g } = lienzo(16, 16);
  cara(g, 0, 0);
  return c;
}

// Conserva las dimensiones del sprite del hub; los dos cuadros son respiración.
export function cuerpoPerrones(): HTMLCanvasElement[] {
  return [0, 1].map((cuadro) => {
    const { c, g } = lienzo(20, 29);
    pixel(g, COLOR.contorno, 2, 15, 16, 10);
    pixel(g, COLOR.contorno, 1, 18, 18, 5);
    pixel(g, COLOR.crema, 3, 16, 14, 8);
    pixel(g, COLOR.sombra, 3, 21, 14, 3);
    pixel(g, COLOR.canela, 13, 17, 4, 5);
    pixel(g, COLOR.contorno, 3, 23, 5, 4);
    pixel(g, COLOR.contorno, 12, 23, 5, 4);
    pixel(g, COLOR.luz, 4, 23, 3, 3);
    pixel(g, COLOR.luz, 13, 23, 3, 3);
    pixel(g, COLOR.contorno, 18, 17 + cuadro, 2, 3);
    pixel(g, COLOR.crema, 18, 17 + cuadro);
    cara(g, 2, 3 + cuadro);
    return c;
  });
}

export function retratoPerrones(): HTMLCanvasElement {
  const { c, g } = lienzo(84, 150);
  pixel(g, '#19233b', 0, 0, 84, 150);
  pixel(g, '#30374c', 0, 91, 84, 59);
  pixel(g, '#66504c', 0, 130, 84, 20);
  pixel(g, '#d8b574', 2, 2, 80, 1);
  pixel(g, '#d8b574', 2, 147, 80, 1);
  pixel(g, '#d8b574', 2, 3, 1, 144);
  pixel(g, '#d8b574', 81, 3, 1, 144);
  pixel(g, '#f3d59b', 59, 15, 12, 8);
  pixel(g, '#f3d59b', 61, 13, 8, 12);
  pixel(g, '#f3d59b', 15, 18, 2, 2);
  pixel(g, '#f3d59b', 35, 10);
  g.drawImage(cuerpoPerrones()[0], 2, 27, 80, 116);
  return c;
}
