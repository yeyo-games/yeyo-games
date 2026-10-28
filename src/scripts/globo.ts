// El globo de selección: una esfera con la cuadrícula de juegos al frente y una rejilla de alambre
// cian/magenta que gira sola, sobre un fondo rojo con las letras YEYO / GAMES desplazándose.
// Todo se dibuja en un canvas de 640 × 480 (como la consola) que el CSS escala a la pantalla.

export type Celda = {
  i: number;
  col: number;
  fila: number;
  imagen: HTMLCanvasElement;
  bloqueada: boolean;
  titulo: string;
  href?: string;
};

export type Retrato = { retrato: HTMLCanvasElement; cuerpo: HTMLCanvasElement[] };

// Varias constantes vienen del juego (decomp de la versión de PS2): la escena se corre 80 unidades
// hacia el lado vacío cuando sólo está el jugador 1 y vuelve al centro cuando entra el 2; el anillo
// del fondo son 32 objetos a 11.25°; los retratos entran volando desde (±900, −100, +800) en
// 40/38/36 cuadros según la columna (más 0–3 al azar); el cursor aparece a escala 1.2 y baja 0.04
// por cuadro, su brillo cicla cada 50 cuadros, al confirmar se desvanece 0.05 por cuadro mientras
// crece 0.01 y luego pulsa a 1.3; su hijo gira una vuelta cada 64 cuadros.
const W = 640;
const H = 480;
const CX_P1 = 320 + 80;
const CX_AMBOS = 320;
const CY = 242;
const R = 170;
const SEP = (26 * Math.PI) / 180; // separación entre celdas
const MEDIA = (11.8 * Math.PI) / 180; // media celda
const PERSPECTIVA = 0.18;
const ANILLO = 'YEYO.GAMES      YEYO.GAMES      '; // 32 objetos a 11.25°
const PASO_ANILLO = (2 * Math.PI) / 32;
const CUADRO = 1000 / 60;
// Paleta de la rejilla, de los colores empaquetados del juego (0x06F9E8 … 0xD32CFB).
const REJILLA = ['#06f9e8', '#29d6ec', '#748bf3', '#b44bf8', '#d32cfb'];
let cx = CX_P1;

type P3 = [number, number, number];
type P2 = [number, number, number]; // x, y en pantalla y z (profundidad, −1..1)

function punto(lon: number, lat: number, yaw: number, pitch: number): P3 {
  const x = Math.cos(lat) * Math.sin(lon);
  const y = -Math.sin(lat);
  const z = Math.cos(lat) * Math.cos(lon);
  const x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
  const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
  const y2 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
  const z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);
  return [x1, y2, z2];
}

function proyectar([x, y, z]: P3, radio = R): P2 {
  const s = radio * (1 + PERSPECTIVA * z);
  return [cx + x * s, CY + y * s, z];
}

// Ruido de valor suavizado para las nubes rojas del fondo.
function nubes(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  const gx = 9;
  const gy = 7;
  const malla = Array.from({ length: (gx + 1) * (gy + 1) }, () => Math.random());
  const img = g.createImageData(w, h);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const u = (i / w) * gx;
      const v = (j / h) * gy;
      const i0 = Math.floor(u);
      const j0 = Math.floor(v);
      const fu = u - i0;
      const fv = v - j0;
      const m = (a: number, b: number) => malla[(b % gy) * (gx + 1) + (a % gx)];
      const n = (m(i0, j0) * (1 - fu) + m(i0 + 1, j0) * fu) * (1 - fv) + (m(i0, j0 + 1) * (1 - fu) + m(i0 + 1, j0 + 1) * fu) * fv;
      const k = (j * w + i) * 4;
      const v2 = n ** 1.8;
      img.data[k] = 18 + 185 * v2;
      img.data[k + 1] = 2 + 16 * v2;
      img.data[k + 2] = 6 + 18 * v2;
      img.data[k + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

export class Globo {
  readonly canvas: HTMLCanvasElement;
  private g: CanvasRenderingContext2D;
  private celdas: Celda[];
  private cols: number;
  private filas: number;
  private fuente: string;
  private nube: HTMLCanvasElement;
  private yaw = 0;
  private pitch = 0;
  private giro = 0;
  private encendidoDesde = -1;
  private sacudidaHasta = 0;
  private ultimo = 0;
  private cxObj = CX_P1;
  private cursorDesde = 0;
  private bloqueoDesde = -1;
  private entradas: { inicio: number; dur: number }[] = [];
  private reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  sel = 0;
  retrato: Retrato | null = null;

  constructor(canvas: HTMLCanvasElement, celdas: Celda[], cols: number, filas: number, fuente: string) {
    this.canvas = canvas;
    this.g = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.celdas = celdas;
    this.cols = cols;
    this.filas = filas;
    this.fuente = fuente;
    this.nube = nubes(96, 72);
  }

  private lon(col: number) {
    return (col - (this.cols - 1) / 2) * SEP;
  }
  private lat(fila: number) {
    return ((this.filas - 1) / 2 - fila) * SEP;
  }

  seleccionar(i: number) {
    this.sel = i;
    this.cursorDesde = performance.now();
  }

  sacudir() {
    this.sacudidaHasta = performance.now() + 320;
  }

  // Confirmado: el cursor se desvanece y pulsa.
  bloquear() {
    this.bloqueoDesde = performance.now();
  }

  // Con el jugador 2 dentro la escena vuelve al centro.
  p2(dentro: boolean) {
    this.cxObj = dentro ? CX_AMBOS : CX_P1;
  }

  encender() {
    const ahora = performance.now();
    this.encendidoDesde = ahora;
    this.cursorDesde = ahora;
    const centro = (this.cols - 1) / 2;
    this.entradas = this.celdas.map((c) => ({
      inicio: ahora + 350,
      dur: (36 + 2 * Math.abs(c.col - centro) + Math.floor(Math.random() * 4)) * CUADRO,
    }));
  }

  // Progreso 0..1 de la entrada volando de una celda.
  private entrada(i: number, ahora: number) {
    const e = this.entradas[i];
    if (!e) return 1;
    return Math.min(1, Math.max(0, (ahora - e.inicio) / e.dur));
  }

  // Celda bajo un punto del canvas (coordenadas 640 × 480), o null.
  celdaEn(x: number, y: number): Celda | null {
    let mejor: Celda | null = null;
    let d2 = Infinity;
    for (const c of this.celdas) {
      const [px, py, z] = proyectar(punto(this.lon(c.col), this.lat(c.fila), this.yaw, this.pitch));
      if (z < 0.05) continue;
      const radio = R * Math.sin(MEDIA) * (1 + PERSPECTIVA * z) * 1.15;
      const d = (px - x) ** 2 + (py - y) ** 2;
      if (d < radio * radio && d < d2) {
        d2 = d;
        mejor = c;
      }
    }
    return mejor;
  }

  dibujar(ahora: number) {
    const dt = Math.min(0.05, (ahora - this.ultimo) / 1000 || 0);
    this.ultimo = ahora;
    const t = ahora / 1000;
    const g = this.g;
    const c = this.celdas[this.sel];
    const yawObj = -this.lon(c.col) * 0.55;
    const pitchObj = -this.lat(c.fila) * 0.45;
    const k = Math.min(1, dt * 7);
    this.yaw += (yawObj - this.yaw) * k;
    this.pitch += (pitchObj - this.pitch) * k;
    cx += (this.cxObj - cx) * k;
    if (!this.reducido) this.giro += dt * 0.35;

    const enc = this.encendidoDesde < 0 ? 0 : Math.min(1, (ahora - this.encendidoDesde) / 900);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#000';
    g.fillRect(0, 0, W, H);
    if (enc <= 0) return;

    // Encendido: la imagen se abre desde una línea horizontal, como un tubo.
    const e = 1 - (1 - enc) ** 3;
    g.setTransform(1, 0, 0, e, 0, (H * (1 - e)) / 2);
    g.globalAlpha = Math.min(1, enc * 1.5);
    if (this.sacudidaHasta > ahora) g.translate(Math.sin(ahora / 12) * 4, 0);

    this.fondo(t);
    this.esfera(t, ahora);
    this.panel(t);
    g.globalAlpha = 1;
  }

  private fondo(t: number) {
    const g = this.g;
    g.imageSmoothingEnabled = true;
    const dx = (t * 6) % W;
    g.drawImage(this.nube, dx - W, 0, W, H);
    g.drawImage(this.nube, dx, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha *= 0.6;
    const dy = (t * 4) % H;
    g.drawImage(this.nube, 0, dy - H, W, H);
    g.drawImage(this.nube, 0, dy, W, H);
    g.globalAlpha /= 0.6;
    g.globalCompositeOperation = 'source-over';
    g.imageSmoothingEnabled = false;

    // Letras grandes que se desplazan en direcciones opuestas.
    g.font = `78px ${this.fuente}`;
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.lineWidth = 4;
    g.strokeStyle = 'rgba(0,0,0,0.55)';
    g.fillStyle = 'rgba(18,28,110,0.5)';
    for (const [texto, y, vel] of [['YEYO', 118, 22], ['GAMES', 372, -17]] as const) {
      const ancho = g.measureText(texto).width + 160;
      const off = (((vel * t) % ancho) + ancho) % ancho;
      for (let xx = off - ancho; xx < W + ancho; xx += ancho) {
        g.strokeText(texto, xx, y);
        g.fillText(texto, xx, y);
      }
    }

    // Columnas de texto pequeño que suben.
    g.font = `8px ${this.fuente}`;
    g.fillStyle = 'rgba(70,95,210,0.35)';
    const linea = 'YEYO GAMES ';
    for (const [x, vel] of [[14, 18], [152, 26], [268, 14], [462, 22], [612, 30]] as const) {
      const paso = 12;
      const alto = linea.length * paso;
      const off = (t * vel) % alto;
      for (let i = 0; i < linea.length * 3; i++) {
        const y = ((i * paso - off) % (H + alto)) - 10;
        if (y < -10 || y > H) continue;
        g.fillText(linea[i % linea.length], x, y);
      }
    }

    // Letras azules que parpadean, sembradas por tiempo para que duren unos cuadros.
    g.font = `11px ${this.fuente}`;
    g.fillStyle = 'rgba(90,130,255,0.75)';
    const semilla = Math.floor(t * 6);
    for (let i = 0; i < 7; i++) {
      const r = Math.sin(semilla * 97.3 + i * 13.7) * 43758.5;
      const f = r - Math.floor(r);
      const r2 = Math.sin(semilla * 31.1 + i * 7.9) * 12345.6;
      const f2 = r2 - Math.floor(r2);
      g.fillText('YEYOGAMES'[Math.floor(f * 9)], Math.floor(f * W), Math.floor(f2 * H));
    }
  }

  private esfera(t: number, ahora: number) {
    const g = this.g;
    const degr = g.createLinearGradient(0, CY - R, 0, CY + R);
    REJILLA.forEach((c, i) => degr.addColorStop(i / (REJILLA.length - 1), c));
    const yawW = this.yaw * 0.5 + this.giro;
    const pitchW = this.pitch * 0.5 + 0.12;

    // Parte trasera de la rejilla, tenue.
    this.rejilla(yawW, pitchW, degr, false);

    // Cuerpo de la esfera.
    const cuerpo = g.createRadialGradient(cx - R * 0.35, CY - R * 0.35, R * 0.1, cx, CY, R);
    cuerpo.addColorStop(0, 'rgba(60,80,170,0.42)');
    cuerpo.addColorStop(1, 'rgba(6,8,34,0.72)');
    g.fillStyle = cuerpo;
    g.beginPath();
    g.arc(cx, CY, R, 0, Math.PI * 2);
    g.fill();

    // Celdas, de atrás hacia delante.
    const proy = this.celdas
      .map((c) => ({ c, p: proyectar(punto(this.lon(c.col), this.lat(c.fila), this.yaw, this.pitch)) }))
      .filter((x) => x.p[2] > 0.02)
      .sort((a, b) => a.p[2] - b.p[2]);
    for (const { c, p } of proy) this.celda(c, p[2], ahora);

    this.rejilla(yawW, pitchW, degr, true);
    this.anillo(t);
  }

  private rejilla(yaw: number, pitch: number, color: CanvasGradient, frente: boolean) {
    const g = this.g;
    const lineas: P3[][] = [];
    const N = 40;
    for (let lon = 0; lon < 360; lon += 20) {
      const l: P3[] = [];
      for (let i = 0; i <= N; i++) l.push(punto((lon * Math.PI) / 180, -Math.PI / 2 + (Math.PI * i) / N, yaw, pitch));
      lineas.push(l);
    }
    for (let lat = -75; lat <= 75; lat += 15) {
      const l: P3[] = [];
      for (let i = 0; i <= N; i++) l.push(punto((2 * Math.PI * i) / N, (lat * Math.PI) / 180, yaw, pitch));
      lineas.push(l);
    }
    g.strokeStyle = color;
    g.lineCap = 'round';
    const pasadas: [number, number][] = frente ? [[4, 0.22], [1.5, 0.95]] : [[1, 0.16]];
    for (const [ancho, alfa] of pasadas) {
      g.lineWidth = ancho;
      g.globalAlpha *= alfa;
      g.beginPath();
      for (const l of lineas) {
        let abierto = false;
        for (const p of l) {
          const [x, y, z] = proyectar(p);
          if (frente ? z >= 0 : z < 0) {
            if (abierto) g.lineTo(x, y);
            else g.moveTo(x, y);
            abierto = true;
          } else abierto = false;
        }
      }
      g.stroke();
      g.globalAlpha /= alfa;
    }
  }

  private celda(c: Celda, z: number, ahora: number) {
    const g = this.g;
    const lon = this.lon(c.col);
    const lat = this.lat(c.fila);
    const esq = (dl: number, dt: number) => proyectar(punto(lon + dl, lat + dt, this.yaw, this.pitch));
    let [ax, ay] = esq(-MEDIA, MEDIA);
    let [bx, by] = esq(MEDIA, MEDIA);
    let [cx, cy] = esq(MEDIA, -MEDIA);
    let [dx, dy] = esq(-MEDIA, -MEDIA);

    // Entrada volando: desde fuera de la pantalla, más lejos (más pequeña), hasta su sitio.
    const e = this.entrada(c.i, ahora);
    if (e < 1) {
      const mx = (ax + bx + cx + dx) / 4;
      const my = (ay + by + cy + dy) / 4;
      const lado = c.col < (this.cols - 1) / 2 ? -1 : 1;
      const ox = lado * 900 * (1 - e);
      const oy = -100 * (1 - e);
      const s = 0.54 + 0.46 * e;
      const mueve = (x: number, y: number): [number, number] => [mx + (x - mx) * s + ox, my + (y - my) * s + oy];
      [ax, ay] = mueve(ax, ay);
      [bx, by] = mueve(bx, by);
      [cx, cy] = mueve(cx, cy);
      [dx, dy] = mueve(dx, dy);
    }
    const n = c.imagen.width;
    g.save();
    g.transform((bx - ax) / n, (by - ay) / n, (dx - ax) / n, (dy - ay) / n, ax, ay);
    g.drawImage(c.imagen, 0, 0);
    g.restore();
    const oscuro = Math.max(0, 0.55 - z * 0.8);
    if (oscuro > 0) {
      g.fillStyle = `rgba(0,0,20,${oscuro})`;
      g.beginPath();
      g.moveTo(ax, ay);
      g.lineTo(bx, by);
      g.lineTo(cx, cy);
      g.lineTo(dx, dy);
      g.closePath();
      g.fill();
    }
    g.beginPath();
    g.moveTo(ax, ay);
    g.lineTo(bx, by);
    g.lineTo(cx, cy);
    g.lineTo(dx, dy);
    g.closePath();
    g.lineWidth = 1.5;
    g.strokeStyle = c.bloqueada ? 'rgba(150,120,60,0.8)' : '#f4b53c';
    g.stroke();
    if (c.i === this.sel && e >= 1) this.cursor([ax, ay, bx, by, cx, cy, dx, dy], ahora);
  }

  // Cursor del jugador 1 sobre la celda: marco rojo con la animación del juego y un hijo que gira.
  private cursor([ax, ay, bx, by, cx, cy, dx, dy]: number[], ahora: number) {
    const g = this.g;
    const f = (ahora - this.cursorDesde) / CUADRO; // cuadros desde el último movimiento
    let escala = Math.max(1, 1.2 - 0.04 * f);
    let alfa = 1;
    let pulso = 0;
    if (this.bloqueoDesde >= 0) {
      const fb = (ahora - this.bloqueoDesde) / CUADRO;
      if (fb < 20) {
        alfa = Math.max(0, 1 - 0.05 * fb);
        escala = 1 + 0.01 * fb;
      } else {
        alfa = 0;
        const fp = fb - 20;
        pulso = fp < 3 ? 1 + 0.1 * fp : Math.max(1, 1.3 - 0.1 * (fp - 3));
      }
    }
    const brillo = 1 - 0.02 * (Math.floor(f) % 50);
    const mx = (ax + bx + cx + dx) / 4;
    const my = (ay + by + cy + dy) / 4;
    const marco = (s: number) => {
      g.beginPath();
      g.moveTo(mx + (ax - mx) * s, my + (ay - my) * s);
      g.lineTo(mx + (bx - mx) * s, my + (by - my) * s);
      g.lineTo(mx + (cx - mx) * s, my + (cy - my) * s);
      g.lineTo(mx + (dx - mx) * s, my + (dy - my) * s);
      g.closePath();
    };
    if (alfa > 0) {
      marco(escala);
      g.lineWidth = 5;
      g.strokeStyle = `rgba(255,40,40,${(0.35 * brillo * alfa).toFixed(3)})`;
      g.stroke();
      g.lineWidth = 2.5;
      g.strokeStyle = `rgba(255,40,40,${alfa.toFixed(3)})`;
      g.stroke();
      g.lineWidth = 1;
      g.strokeStyle = `rgba(255,255,255,${alfa.toFixed(3)})`;
      g.stroke();
      // Hijo: un rombo que gira una vuelta cada 64 cuadros.
      const r = Math.hypot(bx - ax, by - ay) * 0.52 * escala;
      g.save();
      g.translate(mx, my);
      g.rotate((f * 2 * Math.PI) / 64);
      g.lineWidth = 1;
      g.strokeStyle = `rgba(255,120,120,${(0.6 * alfa).toFixed(3)})`;
      g.strokeRect(-r, -r, r * 2, r * 2);
      g.restore();
    }
    if (pulso > 0) {
      marco(pulso);
      g.lineWidth = 3;
      g.strokeStyle = '#fff';
      g.stroke();
    }
  }

  private anillo(t: number) {
    const g = this.g;
    const n = ANILLO.length;
    const paso = PASO_ANILLO;
    const tilt = 0.42;
    const base = (this.reducido ? 0 : -t * 0.3) + Math.PI;
    g.font = `13px ${this.fuente}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const letras: { x: number; y: number; z: number; ang: number; ch: string }[] = [];
    for (let i = 0; i < n; i++) {
      if (ANILLO[i] === ' ') continue;
      const a = base + i * paso;
      const p = (ang: number): P3 => {
        const x = 1.22 * Math.sin(ang);
        const z0 = 1.22 * Math.cos(ang);
        return [x, -z0 * Math.sin(tilt), z0 * Math.cos(tilt)];
      };
      const [x, y, z] = proyectar(p(a));
      const [x2, y2] = proyectar(p(a + 0.02));
      letras.push({ x, y, z, ang: Math.atan2(y2 - y, x2 - x), ch: ANILLO[i] });
    }
    letras.sort((a, b) => a.z - b.z);
    for (const l of letras) {
      g.save();
      g.translate(l.x, l.y);
      g.rotate(l.ang);
      const s = 0.75 + 0.35 * l.z;
      g.scale(s, s);
      g.globalAlpha *= l.z > 0 ? 1 : 0.3;
      g.lineWidth = 4;
      g.strokeStyle = 'rgba(70,0,160,0.9)';
      g.strokeText(l.ch, 0, 0);
      g.fillStyle = l.z > 0 ? '#d8fbff' : '#8aa0c0';
      g.fillText(l.ch, 0, 0);
      g.restore();
      g.globalAlpha /= l.z > 0 ? 1 : 0.3;
    }
  }

  // Panel del jugador 1: retrato vertical y sprite del juego elegido.
  private panel(t: number) {
    const g = this.g;
    const r = this.retrato;
    if (!r) return;
    g.fillStyle = '#05060c';
    g.fillRect(22, 26, 92, 158);
    g.drawImage(r.retrato, 26, 30);
    g.lineWidth = 2;
    g.strokeStyle = '#f4e27a';
    g.strokeRect(25, 29, 86, 152);
    g.strokeStyle = 'rgba(40,220,255,0.7)';
    g.strokeRect(22, 26, 92, 158);
    const cuadro = r.cuerpo[Math.floor(t * 2.2) % r.cuerpo.length];
    g.drawImage(cuadro, 44, 272, 80, 116);
  }
}
