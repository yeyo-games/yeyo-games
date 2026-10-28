// Arte pixel del menú, dibujado por código: el zombi de Dead Zone (cara para la celda y el
// retrato, cuerpo entero para el sprite) y la silueta de las celdas bloqueadas.
// Paleta tomada del propio Dead Zone (piel, camisa, contorno, naranja de la mira).

const PALETA: Record<string, string> = {
  h: '#2b241d', // pelo
  s: '#9aab84', // piel
  d: '#7d8c68', // piel en sombra
  o: '#141612', // contorno
  e: '#2a1c14', // cuenca
  r: '#d9783a', // ojo
  m: '#4a2a26', // boca
  t: '#e8e4d0', // dientes
  b: '#8a2a2a', // sangre
  c: '#5d6b4f', // camisa
  k: '#46523a', // camisa rota
  p: '#2f3440', // pantalón
  w: '#1d1a17', // zapatos
};

const CARA = [
  '....hhhhhhhh....',
  '..hhhhhhhhhhhh..',
  '.hhhhhhhhhhhhhh.',
  '.hhsssssssssshh.',
  '.hssssssssssssh.',
  '.osssssssssssso.',
  '.oseessssseesso.',
  '.oserrsssserrso.',
  '.osssssssssssso.',
  '.osssdsssdsssso.',
  '..ossbsssssssso.',
  '..ossmmmmmmsso..',
  '..osmtmtmtmmso..',
  '...ossmmmmsso...',
  '....osssssso....',
  '.....oooooo.....',
];

const CUERPO = [
  '......hhhhhhhh......',
  '.....hhhhhhhhhh.....',
  '.....hssssssssh.....',
  '.....osssssssso.....',
  '.....oseesseeso.....',
  '.....osrrssrrso.....',
  '.....osssdssdso.....',
  '......osmmmmso......',
  '......ossmmsso......',
  '.......osssso.......',
  '........osso........',
  '.....occcccccco.....',
  '...ooccccccccccoo...',
  '.osscccckccckcccsso.',
  'ossssccckcccckcsssso',
  'osdssoccccccccossdso',
  'oooo.occcccccco.oooo',
  '.....okccccccko.....',
  '.....occcccccco.....',
  '.....oppppppppo.....',
  '.....opppoopppo.....',
  '.....opppoopppo.....',
  '.....opppoopppo.....',
  '.....opppoopppo.....',
  '.....opppoopppo.....',
  '.....owwwoowwwo.....',
  '....owwwwoowwwwo....',
  '....oooooooooooo....',
];
const CABEZA = 11; // filas del cuerpo que son la cabeza (se mueven en el segundo cuadro)

function lienzo(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.imageSmoothingEnabled = false;
  return { c, g };
}

function pintar(g: CanvasRenderingContext2D, mapa: string[], x = 0, y = 0, desde = 0, hasta = mapa.length) {
  for (let j = desde; j < hasta; j++) {
    const fila = mapa[j];
    for (let i = 0; i < fila.length; i++) {
      const col = PALETA[fila[i]];
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(x + i, y + j, 1, 1);
    }
  }
}

// Cara 16 × 16 para la celda del globo.
export function caraDeadZone() {
  const { c, g } = lienzo(16, 16);
  pintar(g, CARA);
  return c;
}

// Cuerpo entero 20 × 29, dos cuadros: en el segundo la cabeza cae un píxel (balanceo).
export function cuerpoDeadZone(): HTMLCanvasElement[] {
  return [0, 1].map((cuadro) => {
    const { c, g } = lienzo(20, 29);
    pintar(g, CUERPO, 0, 0, CABEZA);
    pintar(g, CUERPO, 0, cuadro, 0, CABEZA);
    return c;
  });
}

// Retrato vertical 84 × 150: la cara en primer plano y la mira de Dead Zone debajo.
export function retratoDeadZone() {
  const { c, g } = lienzo(84, 150);
  g.fillStyle = '#0c0e0b';
  g.fillRect(0, 0, 84, 150);
  g.drawImage(caraDeadZone(), -6, 6, 96, 96);
  g.strokeStyle = '#d9783a';
  g.lineWidth = 3;
  g.beginPath();
  g.arc(42, 124, 14, 0, Math.PI * 2);
  g.stroke();
  g.lineCap = 'round';
  for (const [x1, y1, x2, y2] of [[42, 104, 42, 112], [42, 136, 42, 144], [22, 124, 30, 124], [54, 124, 62, 124]]) {
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();
  }
  return c;
}

// Celda bloqueada: silueta oscura con «?».
export function siluetaBloqueada(fuente: string) {
  const { c, g } = lienzo(16, 16);
  const f = g.createLinearGradient(0, 0, 0, 16);
  f.addColorStop(0, '#1a2244');
  f.addColorStop(1, '#070a18');
  g.fillStyle = f;
  g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#04060f';
  g.beginPath();
  g.arc(8, 6, 3.5, 0, Math.PI * 2);
  g.fill();
  g.fillRect(2, 11, 12, 5);
  g.fillStyle = '#3a4a90';
  g.font = `8px ${fuente}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('?', 8, 9);
  return c;
}

// Retrato bloqueado: la misma silueta, grande.
export function retratoBloqueado(fuente: string) {
  const { c, g } = lienzo(84, 150);
  g.fillStyle = '#070a18';
  g.fillRect(0, 0, 84, 150);
  g.fillStyle = '#03050c';
  g.beginPath();
  g.arc(42, 48, 26, 0, Math.PI * 2);
  g.fill();
  g.fillRect(6, 86, 72, 64);
  g.fillStyle = '#2a3570';
  g.font = `32px ${fuente}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('?', 42, 58);
  return c;
}

// Sprite bloqueado: sombra del zombi.
export function cuerpoBloqueado(): HTMLCanvasElement[] {
  return cuerpoDeadZone().map((src) => {
    const { c, g } = lienzo(20, 29);
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = '#05070f';
    g.fillRect(0, 0, 20, 29);
    return c;
  });
}
