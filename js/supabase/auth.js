// js/supabase/auth.js
import { toast } from '../ui/toast.js';
import { show } from '../ui/navigation.js';
import { els } from '../ui/dom.js';

// Bruk window.supa – den er allerede definert i main.js
const { supa } = window;

export function setAuthBusy(busy) {
  ['loginBtn','signupBtn','magicBtn'].forEach(id => {
    const el = els[id];
    if (!el) return;
    el.disabled = !!busy;
    el.classList.toggle('dim', !!busy);
  });
}

export function showAuthError(err) {
  const box = els.authError;
  if (!box) return;
  box.style.display = 'block';
  box.textContent = err?.message || 'Ukjent feil';
}

export function clearAuthError() {
  const box = els.authError;
  if (!box) return;
  box.style.display = 'none';
  box.textContent = '';
}

export async function currentUser() {
  const { data: { user } } = await supa.auth.getUser();
  return user;
}

export async function signOut() {
  await supa.auth.signOut();
  toast('Logget ut');
  show('login');
}
