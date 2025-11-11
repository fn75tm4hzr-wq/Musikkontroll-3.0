// Viser små meldinger nede på skjermen (f.eks. "Lagret")
import { els } from './dom.js';

export function toast(msg) {
  const t = els.toast;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1600);
}