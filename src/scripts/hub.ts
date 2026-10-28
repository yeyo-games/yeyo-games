import { arranque } from './boot';
import { iniciarAudio } from './audio';
import { menu } from './menu';

const m = menu();
const led = document.getElementById('encendido') as HTMLElement;

function encender() {
  const ctx = iniciarAudio();
  led.hidden = true;
  const saltar = arranque(ctx.currentTime + 0.05, () => {
    document.removeEventListener('keydown', saltar);
    document.removeEventListener('pointerdown', saltar);
    m.activar();
  });
  window.setTimeout(() => {
    document.addEventListener('keydown', saltar, { once: true });
    document.addEventListener('pointerdown', saltar, { once: true });
  }, 400);
}

// El navegador sólo deja sonar después de un gesto: si bloquea el audio, la página espera
// con el LED de encendido y cualquier tecla o toque la enciende.
const prueba = iniciarAudio();
if (prueba.state === 'running') encender();
else {
  led.hidden = false;
  const gesto = () => {
    prueba.resume().then(encender);
  };
  document.addEventListener('keydown', gesto, { once: true });
  document.addEventListener('pointerdown', gesto, { once: true });
}
