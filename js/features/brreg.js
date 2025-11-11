// Søk i Brønnøysundregistrene (Brreg) med orgnr
import { els } from '../ui/dom.js';
import { debounce } from '../utils/debounce.js';

export async function searchBrreg() {
  const n = els.orgnr.value.replace(/\D/g, '');
  if (n.length !== 9) {
    if (els.brregLog) els.brregLog.textContent = 'Org.nr må ha 9 siffer';
    return;
  }
  if (els.brregLog) els.brregLog.textContent = 'Søker…';
  try {
    const r = await fetch('https://data.brreg.no/enhetsregisteret/api/enheter/' + n);
    if (!r.ok) throw new Error('Ikke funnet');
    const d = await r.json();
    const a = d.forretningsadresse || d.beliggenhetsadresse || {};
    els.firma.value = d.navn || '';
    els.besoks_postnr.value = a.postnummer || '';
    els.besoks_poststed.value = a.poststed || '';
    els.firma_postadresse.value = (a.adresse || a.adressebeskrivelse || a.gate || '') || '';
    els.firma_postnr.value = a.postnummer || '';
    els.firma_poststed.value = a.poststed || '';
    if (els.brregLog) els.brregLog.textContent = 'Hentet postadresse';
  } catch (e) {
    if (els.brregLog) els.brregLog.textContent = 'Ikke funnet';
  }
}

export const searchBrregDebounced = debounce(searchBrreg, 350);