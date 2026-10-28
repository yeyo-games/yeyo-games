// Arranque: un cubito salta por una retícula dejando cubos detrás hasta dibujar la "y" de yeyo,
// aterriza en el centro con el acorde, y después el cubo de cristal del menú entra girando.
import { aterrizajeCubo, entradaCubo, jingle, silenciar } from './audio';

type Celda = [number, number];
// Retícula de 5 × 6. El recorrido: tronco, brazo izquierdo, vuelo al brazo derecho, vuelo al centro.
const RUTA: Celda[] = [[2, 5], [2, 4], [2, 3], [1, 2], [0, 1], [0, 0], [4, 0], [4, 1], [3, 2], [2, 2]];
const VUELOS = new Set([6, 9]); // índices de RUTA a los que se llega volando, no saltando
const SALTOS = [300, 520, 740, 960, 1180, 1450, 2050, 2270, 2600]; // ms en que empieza cada movimiento
const ATERRIZA = 3250;
const MARCA = 3500;
const DISUELVE = 5700;
const ENTRA = 6300;
const POSA = 8000;
const FIN = 8600;

const CARAS = ['frente', 'atras', 'arriba', 'abajo', 'izq', 'der'];

function mini(logo: HTMLElement, [x, y]: Celda, clase = '') {
  const m = document.createElement('div');
  m.className = `mini ${clase}`;
  m.style.setProperty('--x', String(x));
  m.style.setProperty('--y', String(y));
  for (const c of CARAS) {
    const f = document.createElement('i');
    f.className = c;
    m.append(f);
  }
  logo.append(m);
  return m;
}

const pos = (u: number, [x, y]: Celda, dz = 0) => `translate3d(${x * u}px, ${y * u}px, ${dz}px)`;

export function arranque(t0: number, alTerminar: () => void) {
  const escena = document.getElementById('arranque') as HTMLElement;
  const logo = document.getElementById('logo') as HTMLElement;
  const marca = escena.querySelector('.marca') as HTMLElement;
  const menu = document.getElementById('menu') as HTMLElement;
  const entrada = document.getElementById('entrada') as HTMLElement;
  const timers: number[] = [];
  const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

  escena.hidden = false;
  const u = logo.offsetWidth / 5;
  const rueda = mini(logo, RUTA[0], 'rueda');
  const minis: HTMLElement[] = [rueda];

  jingle(t0, SALTOS.map((s) => s / 1000), ATERRIZA / 1000);
  entradaCubo(t0 + ENTRA / 1000);
  aterrizajeCubo(t0 + POSA / 1000);

  if (reducido) {
    // Sin animación: el logo completo, la marca y el menú en su sitio, sólo con el sonido.
    for (const c of RUTA.slice(0, -1)) minis.push(mini(logo, c));
    marca.style.opacity = '1';
    at(ATERRIZA, () => {
      rueda.style.transform = pos(u, RUTA[9]);
    });
  } else {
    rueda.animate([{ transform: pos(u, RUTA[0], 120), opacity: 0 }, { transform: pos(u, RUTA[0]), opacity: 1 }], {
      duration: 260,
      delay: 40,
      easing: 'cubic-bezier(.2,.8,.3,1)',
      fill: 'both',
    });
    SALTOS.forEach((ms, i) => {
      const de = RUTA[i];
      const a = RUTA[i + 1];
      at(ms, () => {
        minis.push(mini(logo, de));
        const dx = a[0] - de[0];
        const dy = a[1] - de[1];
        const vuelo = VUELOS.has(i + 1);
        const giro = vuelo ? `rotateX(${-dy * 180}deg) rotateY(${dx * 90}deg)` : `rotateX(${-dy * 90}deg) rotateY(${dx * 90}deg)`;
        const medio: Celda = [(de[0] + a[0]) / 2, (de[1] + a[1]) / 2 - (vuelo ? 2.2 : 0.55)];
        rueda.animate(
          [
            { transform: `${pos(u, de)} rotateX(0) rotateY(0)` },
            { transform: `${pos(u, medio, vuelo ? 90 : 18)} ${giro.replace(/(\d+)deg/g, (_, d) => `${d / 2}deg`)}`, offset: 0.5 },
            { transform: `${pos(u, a)} ${giro}` },
          ],
          { duration: vuelo ? (i === 8 ? 650 : 420) : 190, easing: 'cubic-bezier(.3,.6,.5,1)', fill: 'forwards' },
        );
      });
    });
    at(ATERRIZA, () => {
      rueda.classList.add('clave');
      logo.animate([{ transform: 'rotateX(-24deg) rotateY(-36deg) scale(1.05)' }, { transform: 'rotateX(-24deg) rotateY(-36deg)' }], {
        duration: 420,
        easing: 'cubic-bezier(.2,.8,.3,1)',
      });
    });
    at(MARCA, () => marca.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 700, fill: 'forwards', easing: 'ease-out' }));
    at(DISUELVE, () => {
      marca.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450, fill: 'forwards' });
      minis.forEach((m, i) =>
        m.animate([{ opacity: 1 }, { opacity: 0, transform: `${getComputedStyle(m).transform} scale(0.2)` }], {
          duration: 380,
          delay: i * 35,
          fill: 'forwards',
          easing: 'ease-in',
        }),
      );
    });
  }

  at(ENTRA, () => {
    menu.hidden = false;
    if (!reducido) {
      entrada.animate(
        [
          { transform: 'translate3d(-48vw, -46vh, 520px) rotateX(-150deg) rotateY(210deg) rotateZ(55deg)', opacity: 0 },
          { opacity: 1, offset: 0.25 },
          { transform: 'none', opacity: 1 },
        ],
        { duration: POSA - ENTRA, easing: 'cubic-bezier(.22,.85,.3,1)', fill: 'both' },
      );
    }
  });
  at(POSA, () => {
    escena.hidden = true;
    // Si la pestaña estuvo oculta, la animación de entrada pudo quedar a medias: se cierra aquí.
    entrada.getAnimations().forEach((a) => a.finish());
    menu.classList.add('posado');
  });
  at(FIN, alTerminar);

  // Cualquier tecla o toque salta el arranque y deja el menú en su sitio.
  return () => {
    for (const t of timers) clearTimeout(t);
    silenciar();
    escena.hidden = true;
    entrada.getAnimations().forEach((a) => a.cancel());
    menu.hidden = false;
    menu.classList.add('posado');
    alTerminar();
  };
}
