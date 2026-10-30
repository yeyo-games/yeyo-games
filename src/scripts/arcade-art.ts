import type { Retrato } from './globo';
import { caraDeadZone, cuerpoDeadZone, retratoDeadZone } from './sprites';
import { caraPerrones, cuerpoPerrones, retratoPerrones } from './perrones';

export type ArteArcade = { celda: HTMLCanvasElement } & Retrato;
type Limites = { izquierda: number; arriba: number; derecha: number; abajo: number };
type Animacion = {
  cuadros: HTMLCanvasElement[];
  origenX: number;
  suelo: number;
  anchoVisible: number;
  altoVisible: number;
  alturaMinima: number;
  animada: boolean;
};
type Personaje = ArteArcade & { cabeza: HTMLCanvasElement; animacion: Animacion };
export const metricasIdle: Record<string, {
  fuente: string;
  union: Limites;
  unionVisible: Limites;
  cuadros: { alfa: Limites; visible: Limites; pata: { x: number; y: number }; dx: number; dy: number }[];
}> = {};
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
    // El primer cuerpo toca el busto. El fallback conserva el segundo cuerpo
    // completo; el movimiento real procede de la lámina idle independiente.
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

async function cargarImagen(ruta: string): Promise<HTMLImageElement> {
  const url = new URL(ruta, window.location.href);
  if (url.origin !== window.location.origin) throw new Error('El atlas debe ser del mismo origen');
  const imagen = new Image();
  imagen.decoding = 'async';
  imagen.src = url.href;
  await imagen.decode();
  return imagen;
}

function estatica(imagen: HTMLCanvasElement): Animacion {
  const cuadro = quitarMargen(imagen);
  return {
    cuadros: [cuadro], origenX: cuadro.width / 2, suelo: cuadro.height,
    anchoVisible: cuadro.width, altoVisible: cuadro.height,
    alturaMinima: cuadro.height, animada: false,
  };
}

async function cargar(lamina: Lamina): Promise<Personaje> {
  const imagen = await cargarImagen(lamina.ruta);
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
    animacion: estatica(primero),
  };
}

function medirCuadro(cuadro: HTMLCanvasElement) {
  const g = cuadro.getContext('2d');
  if (!g) throw new Error('Canvas 2D no disponible');
  const { width: w, height: h } = cuadro;
  const { data } = g.getImageData(0, 0, w, h);
  const alfa: Limites = { izquierda: w, arriba: h, derecha: 0, abajo: 0 };
  const visible: Limites = { ...alfa };
  const izquierda = Math.floor(w * 0.4);
  let sueloIzquierdo = -1;
  const ampliar = (b: Limites, x: number, y: number) => {
    b.izquierda = Math.min(b.izquierda, x);
    b.arriba = Math.min(b.arriba, y);
    b.derecha = Math.max(b.derecha, x + 1);
    b.abajo = Math.max(b.abajo, y + 1);
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = data[(y * w + x) * 4 + 3];
      if (a > 0) ampliar(alfa, x, y);
      if (a < 64) continue;
      ampliar(visible, x, y);
      if (x < izquierda) sueloIzquierdo = Math.max(sueloIzquierdo, y + 1);
    }
  }
  if (alfa.derecha <= alfa.izquierda || sueloIzquierdo < 1) throw new Error('Cuadro idle sin apoyo visible');
  let peso = 0, sumaX = 0;
  for (let y = Math.max(0, sueloIzquierdo - 15); y < sueloIzquierdo; y++) {
    for (let x = 0; x < izquierda; x++) {
      const a = data[(y * w + x) * 4 + 3];
      if (a < 64) continue;
      peso += a;
      sumaX += (x + 0.5) * a;
    }
  }
  if (!peso) throw new Error('Cuadro idle sin ancla de pata');
  return { alfa, visible, pata: { x: sumaX / peso, y: sueloIzquierdo } };
}

function mediana(valores: number[]): number {
  const orden = [...valores].sort((a, b) => a - b);
  return (orden[2] + orden[3]) / 2;
}

async function cargarIdle(juego: string): Promise<Animacion> {
  const fuente = `/art/${juego}-idle.webp`;
  const imagen = await cargarImagen(fuente);
  if (imagen.naturalWidth !== 1024 || imagen.naturalHeight !== 1536) {
    throw new Error('La lámina idle debe tener seis celdas de 512 píxeles');
  }
  const cuadros = Array.from({ length: 6 }, (_, i) => recortar(imagen,
    [(i % 2) / 2, Math.floor(i / 2) / 3, (i % 2 + 1) / 2, (Math.floor(i / 2) + 1) / 3]));
  const medidas = cuadros.map(medirCuadro);
  const anclaX = mediana(medidas.map((m) => m.pata.x));
  const anclaY = mediana(medidas.map((m) => m.pata.y));
  const registrados = medidas.map((m) => ({ ...m,
    dx: Math.round(anclaX - m.pata.x), dy: Math.round(anclaY - m.pata.y),
  }));
  const unir = (campo: 'alfa' | 'visible'): Limites => ({
    izquierda: Math.min(...registrados.map((m) => m[campo].izquierda + m.dx)),
    arriba: Math.min(...registrados.map((m) => m[campo].arriba + m.dy)),
    derecha: Math.max(...registrados.map((m) => m[campo].derecha + m.dx)),
    abajo: Math.max(...registrados.map((m) => m[campo].abajo + m.dy)),
  });
  // Se conserva todo el alfa, incluidas sombras. El umbral sólo mide apoyo y
  // encuadre visible: no borra píxeles ni neutraliza el movimiento de cabeza.
  const union = unir('alfa'), unionVisible = unir('visible');
  const alineados = cuadros.map((cuadro, i) => {
    const { c, g } = lienzo(union.derecha - union.izquierda, union.abajo - union.arriba);
    g.drawImage(cuadro, registrados[i].dx - union.izquierda, registrados[i].dy - union.arriba);
    return c;
  });
  metricasIdle[juego] = { fuente, union, unionVisible, cuadros: registrados };
  return {
    cuadros: alineados,
    origenX: (unionVisible.izquierda + unionVisible.derecha) / 2 - union.izquierda,
    suelo: unionVisible.abajo - union.arriba,
    anchoVisible: unionVisible.derecha - unionVisible.izquierda,
    altoVisible: unionVisible.abajo - unionVisible.arriba,
    alturaMinima: Math.min(...medidas.map((m) => m.visible.abajo - m.visible.arriba)),
    animada: true,
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

const PESOS_IDLE = [2, 2, 1, 2, 2, 1] as const;
const FPS_IDLE = 8;

function pintarFigura(
  g: CanvasRenderingContext2D,
  animacion: Animacion,
  cx: number,
  baseline: number,
  ancho: number,
  alto: number,
  t: number,
  fase: number,
  demora: number,
  reducido: boolean,
  alturaMinima = 0,
) {
  let indice = 0;
  if (!reducido && animacion.animada) {
    let paso = Math.floor(Math.max(0, t + fase) * FPS_IDLE) % 10;
    while (paso >= PESOS_IDLE[indice] && indice < 5) paso -= PESOS_IDLE[indice++];
  }
  const imagen = animacion.cuadros[indice];
  // Escala única para los seis frames; el ancho del zombi es flexible para
  // conservar al menos 220 píxeles visibles incluso en la pose más agachada.
  const escala = Math.max(
    Math.min(ancho / animacion.anchoVisible, alto / animacion.altoVisible),
    alturaMinima / animacion.alturaMinima,
  );
  const progreso = reducido ? 1 : Math.max(0, Math.min(1, (t - demora) / 0.34));
  const entrada = 1 - Math.pow(1 - progreso, 3);
  const desplazamiento = reducido ? 0 : -(cx + imagen.width * escala / 2 + 12) * (1 - entrada);
  const x = cx + desplazamiento - animacion.origenX * escala;
  const y = baseline - animacion.suelo * escala;
  g.save();
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(imagen, x, y, imagen.width * escala, imagen.height * escala);
  g.restore();
}

// El hub puede cargarlo después de pintar los fallback y aplicar el Record a las
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
          animacion: estatica(arte.cuerpo[0]),
        };
      }
      await Promise.allSettled(LAMINAS.map(async (lamina) => {
        const [atlas, idle] = await Promise.allSettled([cargar(lamina), cargarIdle(lamina.juego)]);
        const personaje = atlas.status === 'fulfilled' ? atlas.value : personajes[lamina.juego];
        if (idle.status === 'fulfilled') personaje.animacion = idle.value;
        else console.warn(`No se pudo cargar la animación de ${lamina.juego}:`, idle.reason);
        personajes[lamina.juego] = personaje;
      }));
      const hermanos = ['perrones', 'frances', 'pug', 'basset'].map((id) => personajes[id]);
      return {
        perrones: {
          celda: personajes.perrones.celda,
          retrato: retratoManada(hermanos),
          cuerpo: personajes.perrones.cuerpo,
          pintarCuerpo: (g, t, reducido) => {
            // Atrás → delante; entrada lateral escalonada, sin flotación vertical.
            pintarFigura(g, personajes.frances.animacion, 270, 300, 100, 115, t, 0.26, 0.18, reducido);
            pintarFigura(g, personajes.basset.animacion, 226, 328, 184, 100, t, 0.18, 0.12, reducido);
            pintarFigura(g, personajes.pug.animacion, 170, 362, 128, 112, t, 0.10, 0.06, reducido);
            pintarFigura(g, personajes.perrones.animacion, 96, 400, 176, 132, t, 0, 0, reducido);
          },
        },
        deadzone: {
          celda: personajes.deadzone.celda,
          retrato: personajes.deadzone.retrato,
          cuerpo: personajes.deadzone.cuerpo,
          pintarCuerpo: (g, t, reducido) => {
            pintarFigura(g, personajes.deadzone.animacion, 140, 400, 200, 240, t, 0, 0, reducido, 220);
          },
        },
      };
    })();
  }
  return carga;
}
