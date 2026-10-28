// Sonido del hub, sintetizado con Web Audio: no hay archivos de audio.
// Timbres de campana (parciales inarmónicos), un sub grave, soplos de ruido y una reverb generada.

let ctx: AudioContext | null = null;
let master: GainNode;
let reverb: ConvolverNode;

export function iniciarAudio(): AudioContext {
  if (ctx) return ctx;
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(ctx.destination);
  reverb = ctx.createConvolver();
  reverb.buffer = impulso(ctx, 2.6, 2.4);
  const cola = ctx.createGain();
  cola.gain.value = 0.38;
  reverb.connect(cola).connect(master);
  return ctx;
}

export const audioActivo = () => ctx?.state === 'running';
export const ahora = () => ctx?.currentTime ?? 0;

export function silenciar() {
  if (!ctx) return;
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(0, t + 0.08);
  master.gain.setValueAtTime(0.55, t + 0.2);
}

function salida(n: AudioNode) {
  n.connect(master);
  n.connect(reverb);
}

function impulso(c: AudioContext, dur: number, caida: number) {
  const n = Math.floor(c.sampleRate * dur);
  const b = c.createBuffer(2, n, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp((-caida * i) / c.sampleRate);
  }
  return b;
}

function ruido(c: AudioContext, dur: number) {
  const n = Math.floor(c.sampleRate * dur);
  const b = c.createBuffer(1, n, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource();
  s.buffer = b;
  return s;
}

function parcial(c: AudioContext, f: number, t: number, dur: number, g: number) {
  const o = c.createOscillator();
  const e = c.createGain();
  o.type = 'sine';
  o.frequency.value = f;
  e.gain.setValueAtTime(0, t);
  e.gain.linearRampToValueAtTime(g, t + 0.004);
  e.gain.exponentialRampToValueAtTime(0.0004, t + dur);
  o.connect(e);
  salida(e);
  o.start(t);
  o.stop(t + dur + 0.05);
}

// Campana: fundamental + dos parciales inarmónicos que se apagan antes.
export function campana(f: number, t: number, dur = 1.4, g = 0.4) {
  if (!ctx) return;
  parcial(ctx, f, t, dur, g);
  parcial(ctx, f * 2.756, t, dur * 0.35, g * 0.22);
  parcial(ctx, f * 5.404, t, dur * 0.18, g * 0.08);
}

// Golpe grave: seno que cae de tono, con un clic de ruido encima.
export function golpe(t: number, g = 0.9) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const e = ctx.createGain();
  o.frequency.setValueAtTime(130, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.35);
  e.gain.setValueAtTime(g, t);
  e.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
  o.connect(e);
  salida(e);
  o.start(t);
  o.stop(t + 1);
  clac(t, 0.35);
}

// Soplo: ruido por un pasabanda que barre de f0 a f1.
export function soplo(t: number, dur: number, f0: number, f1: number, g = 0.5) {
  if (!ctx) return;
  const s = ruido(ctx, dur);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.8;
  bp.frequency.setValueAtTime(f0, t);
  bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const e = ctx.createGain();
  e.gain.setValueAtTime(0.0001, t);
  e.gain.exponentialRampToValueAtTime(g, t + dur * 0.6);
  e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(bp).connect(e);
  salida(e);
  s.start(t);
}

// Clac: ruido brevísimo filtrado, como un objeto que se asienta.
export function clac(t: number, g = 0.5) {
  if (!ctx) return;
  const s = ruido(ctx, 0.08);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1800;
  const e = ctx.createGain();
  e.gain.setValueAtTime(g, t);
  e.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
  s.connect(lp).connect(e);
  salida(e);
  s.start(t);
}

const D4 = 293.66;
const nota = (semis: number) => D4 * 2 ** (semis / 12);
// Pentatónica mayor de Re, ascendiendo con cada salto del cubito.
export const NOTAS_SALTO = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21].map(nota);

// Jingle de arranque (original, no una copia): un repique ascendente que sigue a los saltos,
// un acorde de Re mayor con sub grave al aterrizar y una cola larga.
export function jingle(t0: number, saltos: number[], aterrizaje: number) {
  saltos.forEach((s, i) => campana(NOTAS_SALTO[i % NOTAS_SALTO.length], t0 + s, 1.1, 0.26));
  const t = t0 + aterrizaje;
  golpe(t, 0.8);
  [0, 4, 7, 12, 16].forEach((semis, i) => campana(nota(semis), t + i * 0.012, 3.2, 0.32 - i * 0.03));
  campana(nota(24), t + 0.09, 2.4, 0.1);
  campana(nota(28), t + 0.5, 2.2, 0.06);
}

export function entradaCubo(t: number) {
  soplo(t, 1.5, 220, 1400, 0.35);
}

export function aterrizajeCubo(t: number) {
  clac(t, 0.45);
  golpe(t, 0.35);
  campana(nota(12), t + 0.02, 1.6, 0.08);
}

export function sonarGiro() {
  if (!ctx) return;
  const t = ctx.currentTime;
  soplo(t, 0.28, 500, 1600, 0.18);
  clac(t + 0.3, 0.2);
}

export function sonarOk() {
  if (!ctx) return;
  const t = ctx.currentTime;
  campana(nota(19), t, 0.6, 0.18);
  campana(nota(24), t + 0.07, 0.9, 0.18);
}

export function sonarAtras() {
  if (!ctx) return;
  const t = ctx.currentTime;
  campana(nota(12), t, 0.5, 0.14);
  campana(nota(7), t + 0.07, 0.8, 0.14);
}

export function sonarNo() {
  if (!ctx) return;
  const t = ctx.currentTime;
  campana(nota(5), t, 0.5, 0.14);
  campana(nota(5), t + 0.16, 0.7, 0.12);
}
