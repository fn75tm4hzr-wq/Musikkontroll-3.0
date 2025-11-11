// Bytter mellom sidene (Skjema, Lister, Kontrollert)
import { els } from './dom.js';
import { $$ } from './dom.js';

export function show(page) {
  $$('.page').forEach(x => x.classList.remove('active'));
  $(`#${page}`).classList.add('active');
  els.navButtons.forEach(b => b.classList.toggle('active', b.dataset.page === page));
  if (page === 'kontroll') {
    try { document.scrollingElement.scrollTo({top: 0, behavior: 'instant'}); } catch {}
  }
}