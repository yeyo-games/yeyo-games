// Sonido del hub. La música de la pantalla de selección es un archivo que pone el dueño del sitio
// en `public/audio/select.mp3` (o `.ogg`): aquí sólo se carga y se repite en bucle. Si no existe,
// el menú va en silencio. Los demás sonidos (cursor, confirmar, no, encendido) se sintetizan.

let ctx: AudioContext | null = null;
let master: GainNode;
let musicaGain: GainNode;

export function iniciarAudio(): AudioContext {
  if (ctx) return ctx;
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = 0.6;
  master.connect(ctx.destination);
  musicaGain = ctx.createGain();
  musicaGain.gain.value = 0;
  musicaGain.connect(master);
  return ctx;
}

// Chrome/Safari sólo despiertan el audio con teclado, clic o toque terminado (no con pointerdown):
// se reintenta en cada uno de esos gestos hasta que el contexto corre.
export function reanudar() {
  if (ctx && ctx.state !== 'running') void ctx.resume().catch(() => undefined);
}

export const audioActivo = () => ctx?.state === 'running';

const PISTAS = ['/audio/select.mp3', '/audio/select.ogg'];

async function cargarPista(c: AudioContext): Promise<AudioBuffer | null> {
  for (const url of PISTAS) {
    try {
      const r = await fetch(url);
      if (!r.ok || !/audio|octet/.test(r.headers.get('content-type') ?? '')) continue;
      return await c.decodeAudioData(await r.arrayBuffer());
    } catch {
      /* siguiente formato */
    }
  }
  return null;
}

// Música en bucle. Devuelve `false` si no hay archivo.
export async function musica(): Promise<boolean> {
  const c = iniciarAudio();
  const buffer = await cargarPista(c);
  if (!buffer) return false;
  const s = c.createBufferSource();
  s.buffer = buffer;
  s.loop = true;
  s.connect(musicaGain);
  s.start();
  const t = c.currentTime;
  musicaGain.gain.setValueAtTime(0, t);
  musicaGain.gain.linearRampToValueAtTime(0.7, t + 1.2);
  return true;
}

function tono(tipo: OscillatorType, f0: number, f1: number, t: number, dur: number, g: number) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const e = ctx.createGain();
  o.type = tipo;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  e.gain.setValueAtTime(g, t);
  e.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(e).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function ruido(t: number, dur: number, f: number, g: number) {
  if (!ctx) return;
  const n = Math.floor(ctx.sampleRate * dur);
  const b = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = ctx.createBufferSource();
  s.buffer = b;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = f;
  const e = ctx.createGain();
  e.gain.setValueAtTime(g, t);
  e.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(lp).connect(e).connect(master);
  s.start(t);
}

// Cursor: un blip corto de onda cuadrada.
export function sonarCursor() {
  if (!ctx) return;
  const t = ctx.currentTime;
  tono('square', 1100, 1500, t, 0.05, 0.12);
}

// Confirmar: dos notas que suben, con cuerpo.
export function sonarOk() {
  if (!ctx) return;
  const t = ctx.currentTime;
  tono('square', 660, 660, t, 0.09, 0.16);
  tono('square', 990, 990, t + 0.09, 0.22, 0.16);
  tono('sawtooth', 165, 110, t, 0.3, 0.2);
}

// Bloqueado: zumbido grave.
export function sonarNo() {
  if (!ctx) return;
  const t = ctx.currentTime;
  tono('sawtooth', 140, 90, t, 0.22, 0.2);
  tono('square', 70, 60, t, 0.22, 0.1);
}

// Encendido del tubo: golpe grave, chasquido y un zumbido que sube.
export function sonarEncendido() {
  if (!ctx) return;
  const t = ctx.currentTime;
  ruido(t, 0.12, 900, 0.5);
  tono('sine', 55, 40, t, 0.6, 0.6);
  tono('sine', 220, 1760, t + 0.1, 0.9, 0.05);
  tono('triangle', 3520, 7040, t + 0.15, 0.5, 0.03);
}

// Entra el jugador 2 (la cuenta): arpegio corto.
export function sonarP2() {
  if (!ctx) return;
  const t = ctx.currentTime;
  [523, 659, 784, 1047].forEach((f, i) => tono('square', f, f, t + i * 0.06, 0.12, 0.12));
}
