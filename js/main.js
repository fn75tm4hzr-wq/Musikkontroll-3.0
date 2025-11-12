import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { els, $, $$ } from './ui/dom.js';
import { show } from './ui/navigation.js';
import { toast } from './ui/toast.js';
import { setAuthBusy, showAuthError, clearAuthError, currentUser, signOut, loginEmailPass, signupEmailPass, magicLink } from './supabase/auth.js';
import { searchBrreg, searchBrregDebounced } from './features/brreg.js';
import { addRow, updateTariffDefault } from './features/tariff.js';
import { saveControl } from './supabase/controls.js';
import { generatePDF } from './features/pdf.js';
import { importExcel, renderDashboard } from './features/excel.js';
import { renderArchive } from './features/archive.js';
import { debounce } from './utils/debounce.js';

window.supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const { supa } = window;

if (!supa) {
  console.error('Supabase-biblioteket ble ikke lastet.');
  alert('Fikk ikke lastet Supabase-biblioteket. Skru av "shields"/adblock eller sjekk nettverk.');
}

function resetForm() {
  if (!confirm('Nullstille hele skjemaet?')) return;
  ['orgnr','navn','besoksadresse','besoks_postnr','besoks_poststed','firma','firma_postadresse','firma_postnr','firma_poststed','hoyttalere','kommentar'].forEach(id => els[id].value = '');
  updateTariffDefault();
  if (els.brregLog) els.brregLog.textContent = '';
  toast('Skjema nullstilt');
}

// Events
els.navButtons.forEach(b => b.addEventListener('click', () => show(b.dataset.page)));
els.brregBtn.addEventListener('click', searchBrreg);
els.orgnr.addEventListener('input', () => {
  const n = els.orgnr.value.replace(/\D/g, '');
  if (n.length === 9) searchBrregDebounced();
});
els.addRowBtn.addEventListener('click', () => addRow());
els.resetBtn.addEventListener('click', resetForm);
els.saveDraftBtn.addEventListener('click', () => saveControl('draft'));
els.sendBtn.addEventListener('click', () => saveControl('sent'));
els.printBtn.addEventListener('click', () => generatePDF(window.getFormData()));
els.excelFile.addEventListener('change', importExcel);
els.logoutBtn.addEventListener('click', signOut);
els.search.addEventListener('input', debounce(renderDashboard, 200));

// --- DIN FUNGERENDE LOGIN (flyttet fra auth.js) ---
els.loginBtn.addEventListener('click', async () => {
  clearAuthError();
  const email = (els.email.value || '').trim();
  const password = (els.password.value || '').trim();
  if (!email || !password) { els.authStatus.textContent = 'Skriv inn e-post og passord.'; return; }
  setAuthBusy(true); els.authStatus.textContent = 'Logger inn…';
  try {
    await loginEmailPass(email, password);
    els.authStatus.textContent = 'Innlogget ✔';
    toast('Innlogget');
    show('kontroll'); updateTariffDefault(); renderDashboard(); renderArchive();
  } catch (err) {
    console.error('Login error:', err);
    showAuthError(err);
    els.authStatus.textContent = 'Innlogging feilet.';
  } finally { setAuthBusy(false); }
});

['#email', '#password'].forEach(sel => {
  $(sel).addEventListener('keydown', ev => {
    if (ev.key === 'Enter') els.loginBtn.click();
  });
});

els.signupBtn.addEventListener('click', async () => {
  clearAuthError();
  const email = (els.email.value || '').trim();
  const password = (els.password.value || '').trim();
  if (!email || !password) { els.authStatus.textContent = 'Skriv inn e-post og passord for å opprette.'; return; }
  setAuthBusy(true); els.authStatus.textContent = 'Oppretter bruker…';
  try {
    await signupEmailPass(email, password);
    toast('Bruker opprettet');
    els.authStatus.textContent = 'Bruker opprettet. Sjekk ev. bekreftelses-epost.';
  } catch (err) {
    console.error('Signup error:', err);
    showAuthError(err);
  } finally { setAuthBusy(false); }
});

els.magicBtn.addEventListener('click', async () => {
  clearAuthError();
  const email = (els.email.value || '').trim();
  if (!email) { els.authStatus.textContent = 'Skriv inn e-post for å få lenke.'; return; }
  setAuthBusy(true); els.authStatus.textContent = 'Sender magisk lenke…';
  try {
    await magicLink(email);
    toast('Sjekk e-post for magisk lenke');
    els.authStatus.textContent = 'Magisk lenke sendt.';
  } catch (err) {
    console.error('Magic link error:', err);
    showAuthError(err);
  } finally { setAuthBusy(false); }
});

supa.auth.onAuthStateChange((_e, session) => {
  if (session?.user) {
    show('kontroll'); updateTariffDefault(); renderDashboard(); renderArchive();
  } else {
    show('login');
  }
});

(async function init() {
  const { data: { session } } = await supa.auth.getSession();
  if (session?.user) {
    show('kontroll'); updateTariffDefault(); renderDashboard(); renderArchive();
  } else {
    show('login'); updateTariffDefault();
  }
})();
