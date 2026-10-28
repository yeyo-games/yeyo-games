// Menú: un cubo de cristal. La cara del frente lleva las opciones en sus bordes; elegir una gira el
// cubo hasta la cara de esa opción. Teclado, ratón, táctil (deslizar) y mando.
import { crearCuenta, entrar } from '../lib/account';
import { sonarAtras, sonarGiro, sonarNo, sonarOk } from './audio';

export type Lado = 'arriba' | 'abajo' | 'izquierda' | 'derecha';
type Cara = 'frente' | Lado;

const GIRO: Record<Cara, string> = {
  frente: 'rotateX(0deg) rotateY(0deg)',
  arriba: 'rotateX(-90deg)',
  abajo: 'rotateX(90deg)',
  izquierda: 'rotateY(90deg)',
  derecha: 'rotateY(-90deg)',
};
const TECLAS: Record<string, Lado> = {
  ArrowUp: 'arriba',
  ArrowDown: 'abajo',
  ArrowLeft: 'izquierda',
  ArrowRight: 'derecha',
  w: 'arriba',
  s: 'abajo',
  a: 'izquierda',
  d: 'derecha',
};

export function menu() {
  const raiz = document.getElementById('menu') as HTMLElement;
  const cubo = document.getElementById('cubo') as HTMLElement;
  const caras = new Map<Cara, HTMLElement>();
  for (const c of cubo.querySelectorAll<HTMLElement>('.nucleo .cara')) caras.set(c.dataset.cara as Cara, c);
  const lados = new Set<Lado>([...cubo.querySelectorAll<HTMLElement>('.eti')].map((e) => e.dataset.lado as Lado));
  let actual: Cara = 'frente';
  let activo = false;

  function mostrar(cara: Cara) {
    actual = cara;
    cubo.style.transform = GIRO[cara];
    raiz.dataset.cara = cara;
    for (const [nombre, el] of caras) el.toggleAttribute('inert', nombre !== cara);
    window.setTimeout(() => caras.get(cara)?.querySelector<HTMLElement>('.principal, .eti')?.focus({ preventScroll: true }), 650);
  }

  function ir(lado: Lado) {
    if (!activo || actual !== 'frente' || !lados.has(lado)) return;
    sonarGiro();
    mostrar(lado);
  }

  function volver() {
    if (!activo || actual === 'frente') return;
    sonarAtras();
    mostrar('frente');
  }

  function confirmar() {
    if (!activo || actual === 'frente') return;
    const p = caras.get(actual)?.querySelector<HTMLElement>('.principal');
    if (p && !p.matches(':focus')) p.click();
  }

  for (const e of cubo.querySelectorAll<HTMLElement>('.eti')) e.addEventListener('click', () => ir(e.dataset.lado as Lado));
  for (const a of cubo.querySelectorAll<HTMLAnchorElement>('a.principal')) a.addEventListener('click', () => sonarOk());
  raiz.addEventListener('pointerdown', (ev) => {
    if (actual !== 'frente' && !(ev.target as HTMLElement).closest('.cara')) volver();
  });

  document.addEventListener('keydown', (ev) => {
    if (!activo) return;
    const campo = (ev.target as HTMLElement).matches('input');
    if (ev.key in TECLAS && !campo) {
      ev.preventDefault();
      ir(TECLAS[ev.key]);
    } else if (ev.key === 'Escape' || (ev.key === 'Backspace' && !campo)) {
      ev.preventDefault();
      volver();
    } else if (ev.key === 'Enter' && !campo) confirmar();
  });

  // Deslizar: la dirección del dedo es la opción elegida.
  let toque: [number, number] | null = null;
  raiz.addEventListener('pointerdown', (ev) => {
    toque = ev.pointerType === 'mouse' ? null : [ev.clientX, ev.clientY];
  });
  raiz.addEventListener('pointerup', (ev) => {
    if (!toque) return;
    const dx = ev.clientX - toque[0];
    const dy = ev.clientY - toque[1];
    toque = null;
    if (Math.hypot(dx, dy) < 40) return;
    if (actual !== 'frente') return volver();
    ir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'derecha' : 'izquierda') : dy > 0 ? 'abajo' : 'arriba');
  });

  // Mando: cruceta o palanca izquierda, A confirma, B vuelve.
  let pulsado = new Set<string>();
  function mando() {
    const g = navigator.getGamepads?.()[0];
    if (g) {
      const ahora = new Set<string>();
      const [x, y] = g.axes;
      if (g.buttons[12]?.pressed || y < -0.6) ahora.add('arriba');
      if (g.buttons[13]?.pressed || y > 0.6) ahora.add('abajo');
      if (g.buttons[14]?.pressed || x < -0.6) ahora.add('izquierda');
      if (g.buttons[15]?.pressed || x > 0.6) ahora.add('derecha');
      if (g.buttons[0]?.pressed) ahora.add('A');
      if (g.buttons[1]?.pressed) ahora.add('B');
      for (const k of ahora) {
        if (pulsado.has(k)) continue;
        if (k === 'A') confirmar();
        else if (k === 'B') volver();
        else ir(k as Lado);
      }
      pulsado = ahora;
    }
    requestAnimationFrame(mando);
  }
  window.addEventListener('gamepadconnected', mando, { once: true });

  // Cuenta: todavía sin servicio detrás; la cara responde con el anillo de "?".
  const forma = cubo.querySelector<HTMLFormElement>('form');
  forma?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const datos = new FormData(forma);
    const accion = (ev.submitter as HTMLButtonElement | null)?.value === 'crear' ? crearCuenta : entrar;
    const r = await accion(String(datos.get('nombre')), String(datos.get('pin')));
    if (r.ok) return sonarOk();
    sonarNo();
    forma.classList.add('duda');
    window.setTimeout(() => forma.classList.remove('duda'), 1500);
  });

  mostrar('frente');
  return {
    activar() {
      activo = true;
      raiz.classList.add('listo');
    },
  };
}
