import type { Retrato } from './globo';
import { caraDeadZone, cuerpoDeadZone, retratoDeadZone } from './sprites';
import { caraPerrones, cuerpoPerrones, retratoPerrones } from './perrones';

export type ArteArcade = { celda: HTMLCanvasElement } & Retrato;
type Personaje = ArteArcade & { cabeza: HTMLCanvasElement; manada: HTMLCanvasElement[] };
type Rectangulo = readonly [izquierda: number, arriba: number, derecha: number, abajo: number];
type Lamina = {
  juego: string;
  ruta: string;
  paneles: readonly [Rectangulo, Rectangulo, Rectangulo];
  cara: Rectangulo;
  fallback: () => ArteArcade;
};

// Coordenadas normalizadas, ajustables si se sustituye un atlas. Los cortes caen en
// columnas transparentes medidas: no se dividen las láminas en tercios iguales.
const LAMINAS: readonly Lamina[] = [
  {
    juego: 'perrones',
    ruta: '/art/perrones-arcade.webp',
    paneles: [
      [0, 0, 698 / 2170, 1],
      [698 / 2170, 0, 1485 / 2170, 1],
      [1485 / 2170, 0, 1, 1],
    ],
    cara: [0.18, 0.04, 1, 0.76],
    fallback: () => fallback(caraPerrones(), retratoPerrones(), cuerpoPerrones()),
  },
  {
    juego: 'frances',
    ruta: '/art/frances-arcade.webp',
    paneles: [[0, 0, 682 / 2169, 1], [682 / 2169, 0, 1400 / 2169, 1], [1400 / 2169, 0, 1, 1]],
    cara: [0.18, 0, 1, 0.72],
    fallback: () => hermanoPixel('frances'),
  },
  {
    juego: 'pug',
    ruta: '/art/pug-arcade.webp',
    paneles: [[0, 0, 716 / 2169, 1], [716 / 2169, 0, 1460 / 2169, 1], [1460 / 2169, 0, 1, 1]],
    cara: [0.06, 0.02, 1, 0.76],
    fallback: () => hermanoPixel('pug'),
  },
  {
    juego: 'basset',
    ruta: '/art/basset-arcade.webp',
    // El primer cuerpo toca el busto. Se conserva sólo el segundo cuerpo entero,
    // en ambas poses, y se anima su respiración sin segmentar ni editar el PNG.
    paneles: [[0, 0, 640 / 2172, 1], [1400 / 2172, 0, 1, 1], [1400 / 2172, 0, 1, 1]],
    cara: [0, 0, 1, 0.94],
    fallback: () => hermanoPixel('basset'),
  },
  {
    juego: 'deadzone',
    ruta: '/art/deadzone-arcade.webp',
    paneles: [
      [0, 0, 678 / 1942, 1],
      [678 / 1942, 0, 1416 / 1942, 1],
      [1416 / 1942, 0, 1, 1],
    ],
    cara: [0.24, 0.05, 0.99, 0.65],
    fallback: () => fallback(caraDeadZone(), retratoDeadZone(), cuerpoDeadZone()),
  },
];

function lienzo(ancho: number, alto: number, suave = true) {
  const c = document.createElement('canvas');
  c.width = ancho;
  c.height = alto;
  const g = c.getContext('2d');
  if (!g) throw new Error('Canvas 2D no disponible');
  g.imageSmoothingEnabled = suave;
  g.imageSmoothingQuality = 'high';
  return { c, g };
}

function fallback(
  celda: HTMLCanvasElement,
  retrato: HTMLCanvasElement,
  cuadros: HTMLCanvasElement[],
): ArteArcade {
  return {
    celda,
    retrato,
    cuerpo: cuadros.map((origen) => {
      const { c, g } = lienzo(80, 116, false);
      // Los fallback existentes miden 20 × 29: escala uniforme de cuatro.
      g.drawImage(origen, 0, 0, 80, 116);
      return c;
    }),
  };
}

function hermanoPixel(tipo: 'frances' | 'pug' | 'basset'): ArteArcade {
  const { c: celda, g } = lienzo(16, 16, false);
  const color = tipo === 'frances' ? '#c5c4bb' : tipo === 'pug' ? '#e9c994' : '#b87943';
  g.fillStyle = '#29212a';
  g.fillRect(3, 3, 10, 11);
  g.fillStyle = color;
  g.fillRect(4, 4, 8, 9);
  g.fillStyle = tipo === 'frances' ? '#77766f' : '#47352d';
  g.fillRect(1, tipo === 'frances' ? 0 : 4, 4, tipo === 'basset' ? 11 : 6);
  g.fillRect(11, tipo === 'frances' ? 0 : 4, 4, tipo === 'basset' ? 11 : 6);
  g.fillStyle = tipo === 'pug' ? '#47352d' : '#f4e7cc';
  g.fillRect(4, 9, 8, 4);
  g.fillStyle = '#29212a';
  g.fillRect(5, 7, 1, 1);
  g.fillRect(10, 7, 1, 1);
  g.fillRect(7, 9, 3, 2);
  const { c: cuerpo, g: figura } = lienzo(20, 29, false);
  figura.fillStyle = '#29212a';
  figura.fillRect(1, 18, 18, 8);
  figura.fillStyle = color;
  figura.fillRect(2, 19, 16, 6);
  figura.fillRect(3, 25, 4, 2);
  figura.fillRect(13, 25, 4, 2);
  figura.drawImage(celda, 2, tipo === 'basset' ? 10 : 5);
  const { c: retrato, g: marco } = lienzo(84, 150, false);
  marco.drawImage(celda, 10, 34, 64, 64);
  return fallback(celda, retrato, [cuerpo, cuerpo]);
}

function recortar(
  origen: HTMLImageElement | HTMLCanvasElement,
  rectangulo: Rectangulo,
): HTMLCanvasElement {
  const ancho = origen instanceof HTMLImageElement ? origen.naturalWidth : origen.width;
  const alto = origen instanceof HTMLImageElement ? origen.naturalHeight : origen.height;
  const x = Math.max(0, Math.min(ancho - 1, Math.round(rectangulo[0] * ancho)));
  const y = Math.max(0, Math.min(alto - 1, Math.round(rectangulo[1] * alto)));
  const derecha = Math.max(x + 1, Math.min(ancho, Math.round(rectangulo[2] * ancho)));
  const abajo = Math.max(y + 1, Math.min(alto, Math.round(rectangulo[3] * alto)));
  const { c, g } = lienzo(derecha - x, abajo - y);
  g.drawImage(origen, x, y, c.width, c.height, 0, 0, c.width, c.height);
  return c;
}

// Se lee el alfa una sola vez por panel. No se elimina ningún componente ni se
// seleccionan fragmentos del personaje: sólo se retira el margen transparente.
function quitarMargen(panel: HTMLCanvasElement): HTMLCanvasElement {
  const g = panel.getContext('2d');
  if (!g) throw new Error('Canvas 2D no disponible');
  const { width: ancho, height: alto } = panel;
  const { data } = g.getImageData(0, 0, ancho, alto);
  let izquierda = ancho, arriba = alto, derecha = -1, abajo = -1;
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      if (data[(y * ancho + x) * 4 + 3] === 0) continue;
      izquierda = Math.min(izquierda, x);
      arriba = Math.min(arriba, y);
      derecha = Math.max(derecha, x);
      abajo = Math.max(abajo, y);
    }
  }
  if (derecha < izquierda || abajo < arriba) throw new Error('Panel vacío');
  const { c, g: destino } = lienzo(derecha - izquierda + 1, abajo - arriba + 1);
  destino.drawImage(panel, izquierda, arriba, c.width, c.height, 0, 0, c.width, c.height);
  return c;
}

function encajar(
  g: CanvasRenderingContext2D,
  imagen: HTMLCanvasElement,
  caja: { x: number; y: number; ancho: number; alto: number },
) {
  const escala = Math.min(caja.ancho / imagen.width, caja.alto / imagen.height);
  const ancho = imagen.width * escala, alto = imagen.height * escala;
  g.drawImage(imagen, caja.x + (caja.ancho - ancho) / 2, caja.y + (caja.alto - alto) / 2, ancho, alto);
}

function retrato(busto: HTMLCanvasElement): HTMLCanvasElement {
  const { c, g } = lienzo(84, 150);
  const fondo = g.createLinearGradient(0, 0, 84, 150);
  fondo.addColorStop(0, '#102844');
  fondo.addColorStop(1, '#050d20');
  g.fillStyle = fondo;
  g.fillRect(0, 0, 84, 150);
  g.fillStyle = '#154d78';
  g.beginPath();
  g.moveTo(0, 94);
  g.lineTo(84, 45);
  g.lineTo(84, 104);
  g.lineTo(0, 150);
  g.fill();
  g.fillStyle = '#42b7e0';
  g.fillRect(4, 7, 2, 28);
  g.fillStyle = '#eac16d';
  g.fillRect(57, 5, 22, 2);
  // El busto completo cabe: ninguna cara se recorta para llenar el formato vertical.
  encajar(g, busto, { x: 2, y: 8, ancho: 80, alto: 130 });
  g.fillStyle = '#eac16d';
  g.fillRect(5, 142, 39, 2);
  g.fillStyle = '#42b7e0';
  g.fillRect(47, 142, 32, 2);
  return c;
}

function cuerpos(paneles: readonly HTMLCanvasElement[], ancho = 80, alto = 116): HTMLCanvasElement[] {
  // Una sola escala para las dos poses y una misma línea de patas. El Bulldog
  // conserva su cuerpo ancho y bajo dentro del espacio vertical del sprite.
  const escala = Math.min(
    (ancho - 4) / Math.max(...paneles.map((p) => p.width)),
    (alto - 6) / Math.max(...paneles.map((p) => p.height)),
  );
  const preparados = new Map<HTMLCanvasElement, HTMLCanvasElement>();
  return paneles.map((panel) => {
    const preparado = preparados.get(panel);
    if (preparado) return preparado;
    const { c, g } = lienzo(ancho, alto);
    const w = panel.width * escala, h = panel.height * escala;
    g.drawImage(panel, (ancho - w) / 2, alto - 2 - h, w, h);
    preparados.set(panel, c);
    return c;
  });
}

async function cargar(lamina: Lamina): Promise<Personaje> {
  const url = new URL(lamina.ruta, window.location.href);
  if (url.origin !== window.location.origin) throw new Error('El atlas debe ser del mismo origen');
  const imagen = new Image();
  imagen.decoding = 'async';
  imagen.src = url.href;
  await imagen.decode();
  const recortes = new Map<string, HTMLCanvasElement>();
  const [busto, primero, segundo] = lamina.paneles.map((r) => {
    const clave = r.join(',');
    let panel = recortes.get(clave);
    if (!panel) {
      panel = quitarMargen(recortar(imagen, r));
      recortes.set(clave, panel);
    }
    return panel;
  });
  const cabeza = recortar(busto, lamina.cara);
  const { c: celda, g } = lienzo(16, 16);
  encajar(g, cabeza, { x: 0, y: 0, ancho: 16, alto: 16 });
  return {
    celda, cabeza, retrato: retrato(busto),
    cuerpo: cuerpos([primero, segundo]),
    manada: cuerpos([primero, segundo], 96, 62),
  };
}

function retratoManada(hermanos: readonly Personaje[]): HTMLCanvasElement {
  const { c, g } = lienzo(84, 150);
  g.fillStyle = '#09172c';
  g.fillRect(0, 0, 84, 150);
  hermanos.forEach((hermano, i) => {
    const x = 2 + (i % 2) * 42, y = 4 + Math.floor(i / 2) * 73;
    g.fillStyle = i % 2 ? '#153957' : '#102b48';
    g.fillRect(x, y, 38, 66);
    encajar(g, hermano.cabeza, { x, y: y + 2, ancho: 38, alto: 60 });
    g.fillStyle = i % 2 ? '#eac16d' : '#42b7e0';
    g.fillRect(x, y + 65, 38, 2);
  });
  return c;
}

function suave(valor: number): number {
  const x = Math.max(0, Math.min(1, valor));
  return x * x * (3 - 2 * x);
}

function pintarFigura(
  g: CanvasRenderingContext2D,
  cuadros: readonly HTMLCanvasElement[],
  cx: number,
  baseline: number,
  t: number,
  fase: number,
  reducido: boolean,
) {
  const imagen = cuadros[0];
  const tiempo = reducido ? 0 : Math.max(0, t + fase);
  const ciclo = tiempo % 8.4;
  // Dos poses sostenidas varios segundos; nunca alternancia brusca a 2 FPS.
  const mezcla = reducido || cuadros[0] === cuadros[1] ? 0 : ciclo < 4.2
    ? suave((ciclo - 4) / 0.2)
    : 1 - suave((ciclo - 8.2) / 0.2);
  const respiracion = reducido ? 1 : 1 + Math.sin(tiempo * Math.PI / 2) * 0.012;
  const apoyo = reducido ? 0 : Math.sin(tiempo * Math.PI / 3) * 0.6;
  const w = imagen.width * respiracion, h = imagen.height * respiracion;
  const x = cx - w / 2 + apoyo, y = baseline - (imagen.height - 2) * respiracion;
  g.save();
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  const alfa = g.globalAlpha;
  if (mezcla < 1) {
    g.globalAlpha = alfa * (1 - mezcla);
    g.drawImage(cuadros[0], x, y, w, h);
  }
  if (mezcla > 0) {
    g.globalAlpha = alfa * mezcla;
    g.drawImage(cuadros[1], x, y, w, h);
  }
  g.restore();
}

// Root puede cargarlo después de pintar los fallback y aplicar el Record a las
// celdas existentes. Sólo conserva canvas terminados, sin trabajo en renderloop.
let carga: Promise<Record<string, ArteArcade>> | undefined;
export function cargarArteArcade(): Promise<Record<string, ArteArcade>> {
  if (!carga) {
    carga = (async () => {
      const personajes: Record<string, Personaje> = {};
      for (const lamina of LAMINAS) {
        const arte = lamina.fallback();
        personajes[lamina.juego] = {
          ...arte, cabeza: arte.celda,
          manada: cuerpos(arte.cuerpo.map(quitarMargen), 96, 62),
        };
      }
      await Promise.allSettled(LAMINAS.map(async (lamina) => {
        personajes[lamina.juego] = await cargar(lamina);
      }));
      const hermanos = ['perrones', 'frances', 'pug', 'basset'].map((id) => personajes[id]);
      return {
        perrones: {
          celda: personajes.perrones.celda,
          retrato: retratoManada(hermanos),
          cuerpo: personajes.perrones.cuerpo,
          pintarCuerpo: (g, t, reducido) => hermanos.forEach((hermano, i) => {
            pintarFigura(g, hermano.manada, 52 + (i % 2) * 100,
              309 + Math.floor(i / 2) * 62, t, i * 1.7, reducido);
          }),
        },
        deadzone: {
          celda: personajes.deadzone.celda,
          retrato: personajes.deadzone.retrato,
          cuerpo: personajes.deadzone.cuerpo,
          pintarCuerpo: (g, t, reducido) => {
            pintarFigura(g, personajes.deadzone.cuerpo, 84, 386, t, 0, reducido);
          },
        },
      };
    })();
  }
  return carga;
}
