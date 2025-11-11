// Zoom inn/ut i listen (pluss, minus, reset)
import { els } from './dom.js';

let listScale = 1;

export function applyListScale() {
  els.listsDashboard.style.transform = `scale(${listScale})`;
  els.zoomPct.textContent = Math.round(listScale * 100) + '%';
}

els.zoomPlus.addEventListener('click', () => {
  listScale = Math.min(2, listScale + 0.1);
  applyListScale();
});

els.zoomMinus.addEventListener('click', () => {
  listScale = Math.max(0.6, listScale - 0.1);
  applyListScale();
});

els.zoomReset.addEventListener('click', () => {
  listScale = 1;
  applyListScale();
});

applyListScale();