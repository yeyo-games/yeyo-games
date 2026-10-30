// Menú de selección: mueve el cursor por el globo, confirma el juego y abre el lado del
// jugador 2 (la cuenta). Teclado, ratón, táctil (tocar o deslizar) y mando.
import { crearCuenta, entrar } from '../lib/account';
import type { Celda, Globo } from './globo';
import { sonarCursor, sonarNo, sonarOk, sonarP2 } from './audio';

const TECLAS: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  w: [0, -1],
  s: [0, 1],
  a: [-1, 0],
  d: [1, 0],
};

export type Ui = {
  pantalla: HTMLElement;
  nombre: HTMLElement;
  start: HTMLButtonElement;
  p2: HTMLElement;
  destello: HTMLElement;
};

export function menu(globo: Globo, celdas: Celda[], cols: number, ui: Ui) {
  const forma = ui.p2.querySelector('form') as HTMLFormElement;
  let activo = false;
  let p2 = false;
  let yendo = false;

  function pintarNombre() {
    const c = celdas[globo.sel];
    ui.nombre.textContent = c.titulo;
    ui.nombre.classList.toggle('bloqueado', c.bloqueada);
  }

  function seleccionar(i: number) {
    if (i === globo.sel) return;
    globo.seleccionar(i);
    sonarCursor();
    pintarNombre();
  }

  function mover(dx: number, dy: number) {
    const c = celdas[globo.sel];
    const col = (c.col + dx + cols) % cols;
    const filas = celdas.length / cols;
    const fila = (c.fila + dy + filas) % filas;
    seleccionar(fila * cols + col);
  }

  function confirmar() {
    const c = celdas[globo.sel];
    if (yendo) return;
    if (c.bloqueada || !c.href) {
      sonarNo();
      globo.sacudir();
      return;
    }
    yendo = true;
    sonarOk();
    globo.bloquear();
    ui.destello.classList.add('ok');
    window.setTimeout(() => {
      location.href = c.href as string;
    }, 650);
  }

  function abrirP2() {
    if (p2) return;
    p2 = true;
    sonarP2();
    globo.p2(true);
    ui.p2.hidden = false;
    ui.start.hidden = true;
    ui.pantalla.dataset.p2 = '';
    window.setTimeout(() => forma.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true }), 50);
  }

  function cerrarP2() {
    if (!p2) return;
    p2 = false;
    sonarCursor();
    globo.p2(false);
    ui.p2.hidden = true;
    ui.start.hidden = false;
    delete ui.pantalla.dataset.p2;
    forma.reset();
    (document.activeElement as HTMLElement | null)?.blur();
  }

  ui.start.addEventListener('click', () => {
    if (activo) abrirP2();
    else ui.start.blur();
  });

  document.addEventListener('keydown', (ev) => {
    if (!activo) return;
    const campo = (ev.target as Element).matches?.('input, button') ?? false;
    if (ev.key === 'Escape') {
      ev.preventDefault();
      cerrarP2();
    } else if (campo) return;
    else if (ev.key in TECLAS) {
      ev.preventDefault();
      mover(...TECLAS[ev.key]);
    } else if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      confirmar();
    }
  });

  // Ratón y táctil sobre el globo: tocar una celda la elige (otra vez, confirma); deslizar mueve.
  let toque: [number, number] | null = null;
  globo.canvas.addEventListener('pointerdown', (ev) => {
    if (!activo) return;
    toque = [ev.clientX, ev.clientY];
  });
  globo.canvas.addEventListener('pointerup', (ev) => {
    if (!activo || !toque) return;
    const [x0, y0] = toque;
    toque = null;
    const dx = ev.clientX - x0;
    const dy = ev.clientY - y0;
    if (Math.hypot(dx, dy) > 40) {
      mover(...(Math.abs(dx) > Math.abs(dy) ? [dx > 0 ? 1 : -1, 0] : [0, dy > 0 ? 1 : -1]) as [number, number]);
      return;
    }
    const r = globo.canvas.getBoundingClientRect();
    const c = globo.celdaEn(((ev.clientX - r.left) / r.width) * globo.canvas.width, ((ev.clientY - r.top) / r.height) * globo.canvas.height);
    if (!c) return;
    if (c.i === globo.sel) confirmar();
    else seleccionar(c.i);
  });

  // Mando: cruceta o palanca, A confirma, B cierra la cuenta, Start la abre.
  let pulsado = new Set<string>();
  function mando() {
    const g = navigator.getGamepads?.()[0];
    if (g && activo) {
      const ahora = new Set<string>();
      const [x, y] = g.axes;
      if (g.buttons[12]?.pressed || y < -0.6) ahora.add('arriba');
      if (g.buttons[13]?.pressed || y > 0.6) ahora.add('abajo');
      if (g.buttons[14]?.pressed || x < -0.6) ahora.add('izquierda');
      if (g.buttons[15]?.pressed || x > 0.6) ahora.add('derecha');
      if (g.buttons[0]?.pressed) ahora.add('A');
      if (g.buttons[1]?.pressed) ahora.add('B');
      if (g.buttons[9]?.pressed) ahora.add('start');
      for (const k of ahora) {
        if (pulsado.has(k)) continue;
        if (k === 'A') confirmar();
        else if (k === 'B') cerrarP2();
        else if (k === 'start') abrirP2();
        else if (!p2) mover(k === 'izquierda' ? -1 : k === 'derecha' ? 1 : 0, k === 'arriba' ? -1 : k === 'abajo' ? 1 : 0);
      }
      pulsado = ahora;
    }
    requestAnimationFrame(mando);
  }
  window.addEventListener('gamepadconnected', mando, { once: true });

  // Cuenta: todavía sin servicio detrás; responde con el «?».
  forma.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const datos = new FormData(forma);
    const accion = (ev.submitter as HTMLButtonElement | null)?.value === 'crear' ? crearCuenta : entrar;
    const r = await accion(String(datos.get('nombre')), String(datos.get('pin')));
    if (r.ok) return sonarOk();
    sonarNo();
    forma.classList.add('duda');
    window.setTimeout(() => forma.classList.remove('duda'), 1500);
  });

  pintarNombre();
  return {
    activar() {
      activo = true;
    },
  };
}
