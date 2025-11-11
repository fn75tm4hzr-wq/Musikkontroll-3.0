// Legg til, fjern og oppdater tariff-linjer
import { els } from '../ui/dom.js';
import { sanitize } from '../utils/sanitize.js';

function chooseDays(music, venue) {
  if (music === 'Fremtredende musikk') return 104;
  return venue === 'Serveringssted' ? 356 : 310;
}

export function rowTemplate(preset = {}) {
  const kvm = preset.kvm ?? '';
  const seter = preset.seter ?? '';
  const music = preset.music ?? 'Bakgrunnsmusikk';
  const venue = preset.venue ?? 'Serveringssted';
  const dager = preset.dager ?? chooseDays(music, venue);
  const showSeter = (venue === 'Serveringssted') ? '' : 'display:none';
  return `
    <div class="row tariff-row" data-music="${music}" data-venue="${venue}">
      <input type="number" placeholder="kvm" value="${sanitize(String(kvm))}">
      <input type="number" class="inp-seter" placeholder="sitteplasser" style="${showSeter}" value="${sanitize(String(seter))}">
      <input type="number" class="inp-dager" placeholder="dager/år" value="${sanitize(String(dager))}">
      <select class="sel-music">
        <option ${music==='Bakgrunnsmusikk'?'selected':''}>Bakgrunnsmusikk</option>
        <option ${music==='Fremtredende musikk'?'selected':''}>Fremtredende musikk</option>
      </select>
      <select class="sel-venue">
        <option ${venue==='Serveringssted'?'selected':''}>Serveringssted</option>
        <option ${venue==='Kundelokale'?'selected':''}>Kundelokale</option>
      </select>
      <button type="button" class="icon-btn" title="Fjern">−</button>
    </div>`;
}

export function wireRow(row) {
  const selVenue = row.querySelector('.sel-venue');
  const selMusic = row.querySelector('.sel-music');
  const inpSeter = row.querySelector('.inp-seter');
  const inpDager = row.querySelector('.inp-dager');

  function refresh() {
    const venue = selVenue.value, music = selMusic.value;
    if (venue === 'Serveringssted') {
      inpSeter.style.display = '';
    } else {
      inpSeter.style.display = 'none';
      inpSeter.value = '';
    }
    if (!inpDager.value || Number(inpDager.value) <= 0) {
      inpDager.value = chooseDays(music, venue);
    }
  }

  selVenue.addEventListener('change', refresh);
  selMusic.addEventListener('change', refresh);
  row.querySelector('.icon-btn').addEventListener('click', () => row.remove());
  refresh();
}

export function updateTariffDefault() {
  els.tariffRows.innerHTML = '';
  addRow();
}

export function addRow(preset) {
  const html = rowTemplate(preset);
  els.tariffRows.insertAdjacentHTML('beforeend', html);
  wireRow(els.tariffRows.lastElementChild);
}

window.getFormData = function() {
  const rows = [];
  els.tariffRows.querySelectorAll('.tariff-row').forEach(r => {
    const i = r.querySelectorAll('input,select');
    const kvm = i[0].value;
    const seter = i[1].style.display === 'none' ? '' : i[1].value;
    const dager = i[2].value;
    const music = i[3].value;
    const venue = i[4].value;
    rows.push({ kvm, seter, dager, music, venue });
  });
  return {
    orgnr: els.orgnr.value,
    navn: els.navn.value,
    adresse: els.besoksadresse.value,
    postnr: els.besoks_postnr.value,
    poststed: els.besoks_poststed.value,
    firma: els.firma.value,
    firma_postadresse: els.firma_postadresse?.value || '',
    firma_postnr: els.firma_postnr?.value || '',
    firma_poststed: els.firma_poststed?.value || '',
    tariff: rows,
    hoyttalere: els.hoyttalere.value,
    kommentar: els.kommentar.value,
    dato: new Date().toISOString()
  };
};