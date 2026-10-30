// Portada: una tele CRT apagada con «PRESS START BUTTON». Cualquier tecla, botón o toque la
// enciende (y desbloquea el audio): arranca la música y aparece el globo de selección.
import { games } from '../data/games';
import { iniciarAudio, musica, reanudar, sonarEncendido } from './audio';
import { type Celda, Globo, type Retrato } from './globo';
import { menu, type Ui } from './menu';
import { cargarArteArcade } from './arcade-art';
import { caraPerrones, cuerpoPerrones, retratoPerrones } from './perrones';
import { caraDeadZone, cuerpoBloqueado, cuerpoDeadZone, retratoBloqueado, retratoDeadZone, siluetaBloqueada } from './sprites';

const COLS = 5;
const FILAS = 4;
const FUENTE = '"Press Start 2P", monospace';

// Arte de cada juego, por slug. Los que no tienen quedan como bloqueados.
const ARTE: Record<string, () => { celda: HTMLCanvasElement } & Retrato> = {
  deadzone: () => ({ celda: caraDeadZone(), retrato: retratoDeadZone(), cuerpo: cuerpoDeadZone() }),
  perrones: () => ({ celda: caraPerrones(), retrato: retratoPerrones(), cuerpo: cuerpoPerrones() }),
};

type CeldaHub = Celda & { href?: string; retrato: Retrato };

async function principal() {
  await document.fonts.load(`10px ${FUENTE}`).catch(() => undefined);

  const pantalla = document.getElementById('pantalla') as HTMLElement;
  const canvas = document.getElementById('globo') as HTMLCanvasElement;
  const ui: Ui = {
    pantalla,
    nombre: document.getElementById('nombre') as HTMLElement,
    start: document.getElementById('start') as HTMLButtonElement,
    p2: document.getElementById('p2') as HTMLElement,
    destello: document.getElementById('destello') as HTMLElement,
  };

  const bloqueada = { celda: siluetaBloqueada(FUENTE), retrato: retratoBloqueado(FUENTE), cuerpo: cuerpoBloqueado() };
  const celdas: CeldaHub[] = [];
  for (let i = 0; i < COLS * FILAS; i++) {
    const g = games[i];
    const arte = g && g.status === 'live' && ARTE[g.slug] ? ARTE[g.slug]() : bloqueada;
    celdas.push({
      i,
      col: i % COLS,
      fila: Math.floor(i / COLS),
      imagen: arte.celda,
      bloqueada: !g || g.status !== 'live',
      titulo: g ? g.title.toUpperCase() : '???',
      href: g?.status === 'live' ? g.href : undefined,
      retrato: { retrato: arte.retrato, cuerpo: arte.cuerpo },
    });
  }

  const globo = new Globo(canvas, celdas, COLS, FILAS, FUENTE);
  const m = menu(globo, celdas, COLS, ui);
  const movimiento = document.getElementById('movimiento') as HTMLButtonElement;
  const preferencia = matchMedia('(prefers-reduced-motion: reduce)');
  let eleccion: boolean | null = null;
  try {
    const guardada = localStorage.getItem('yeyo.movimiento');
    if (guardada === 'si' || guardada === 'no') eleccion = guardada === 'si';
  } catch { /* El selector también funciona con almacenamiento bloqueado. */ }
  let animada = eleccion ?? !preferencia.matches;
  function aplicarMovimiento() {
    globo.movimientoReducido(!animada);
    movimiento.textContent = `ANIMACIÓN: ${animada ? 'SÍ' : 'NO'}`;
    movimiento.setAttribute('aria-pressed', String(animada));
    movimiento.setAttribute('aria-label', animada ? 'Desactivar animaciones' : 'Activar animaciones');
  }
  aplicarMovimiento();
  movimiento.addEventListener('click', (ev) => {
    animada = !animada;
    eleccion = animada;
    aplicarMovimiento();
    try { localStorage.setItem('yeyo.movimiento', animada ? 'si' : 'no'); } catch { /* Opcional. */ }
    if (ev.detail > 0) movimiento.blur();
  });
  preferencia.addEventListener('change', () => {
    if (eleccion !== null) return;
    animada = !preferencia.matches;
    aplicarMovimiento();
  });

  // Los controles responden mientras se descarga el arte; si falla, conservan su sprite local.
  void cargarArteArcade().then((arte) => {
    for (let i = 0; i < games.length; i++) {
      const nuevo = arte[games[i].slug];
      if (!nuevo || !celdas[i]) continue;
      celdas[i].imagen = nuevo.celda;
      celdas[i].retrato = { retrato: nuevo.retrato, cuerpo: nuevo.cuerpo, pintarCuerpo: nuevo.pintarCuerpo };
    }
  });

  // El canvas mide 480 de alto y su ancho sigue la proporción de la ventana (de 4:3 a 21:9):
  // --px es cuánto mide un píxel del canvas.
  function medir() {
    const aspecto = Math.min(7 / 3, Math.max(4 / 3, innerWidth / innerHeight));
    const w = Math.min(innerWidth, innerHeight * aspecto);
    globo.ancho(480 * aspecto);
    pantalla.style.width = `${w}px`;
    pantalla.style.aspectRatio = String(aspecto);
    pantalla.style.setProperty('--px', `${w / aspecto / 480}px`);
  }
  medir();
  addEventListener('resize', medir);

  let encendida = false;
  function encender() {
    if (encendida) return;
    encendida = true;
    iniciarAudio();
    reanudar();
    sonarEncendido();
    void musica();
    pantalla.classList.add('encendida');
    movimiento.hidden = false;
    globo.encender();
    const pintar = (t: number) => {
      globo.retrato = celdas[globo.sel].retrato;
      globo.dibujar(t);
      requestAnimationFrame(pintar);
    };
    requestAnimationFrame(pintar);
    window.setTimeout(() => m.activar(), 700);
  }

  const gesto = (ev: Event) => {
    if (ev instanceof KeyboardEvent && (ev.key === 'Tab' || ev.altKey || ev.ctrlKey || ev.metaKey)) return;
    encender();
  };
  document.addEventListener('keydown', gesto);
  document.addEventListener('pointerdown', gesto);
  for (const ev of ['keydown', 'pointerup', 'click', 'touchend']) document.addEventListener(ev, reanudar);
  window.addEventListener('gamepadconnected', () => {
    const espera = () => {
      if (encendida) return;
      if (navigator.getGamepads?.()[0]?.buttons.some((b) => b.pressed)) encender();
      else requestAnimationFrame(espera);
    };
    espera();
  });
}

void principal();
