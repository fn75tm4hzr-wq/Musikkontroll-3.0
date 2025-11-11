// Vis arkiv og eksporter måned til Excel
import { els } from '../ui/dom.js';
import { fetchControls } from '../supabase/controls.js';
import { sanitize } from '../utils/sanitize.js';

function pointsForLine(line) {
  if (line.music === 'Fremtredende musikk') return 550;
  return line.venue === 'Serveringssted' ? 350 : 200;
}

function monthKey(d) {
  return new Date(d).toISOString().slice(0, 7);
}

els.exportBtn.addEventListener('click', async () => {
  const pick = els.expMonth.value || monthKey(new Date());
  const rows = await fetchControls();
  const sel = rows.filter(r => monthKey(r.created_at) === pick);

  let antKontroller = sel.length;
  let antDager = 0;
  let poeng = 0;

  const sheet = [['Dato','Navn','Orgnr','Adresse','Post','Linjer','Kontrolldager','Poeng (TONO)','Poeng (GRAMO)']];
  sel.forEach(c => {
    const d = c.data || {};
    const linjer = (d.tariff || []).map(t => {
      antDager += Number(t.dager || 0);
      poeng += pointsForLine(t);
      return [t.music || '', t.venue || '', t.kvm ? `${t.kvm} kvm` : '', t.seter ? `${t.seter} seter` : '', t.dager ? `${t.dager} dager` : ''].filter(Boolean).join(' • ');
    }).join('\n');
    sheet.push([
      new Date(c.created_at).toLocaleDateString('nb-NO'),
      d.navn || '', d.orgnr || '',
      d.adresse || '',
      ((d.postnr || '') + ' ' + (d.poststed || '')).trim(),
      linjer,
      (d.tariff || []).reduce((s, t) => s + Number(t.dager || 0), 0),
      poeng, poeng
    ]);
  });
  sheet.push([]); sheet.push(['SUM','','','','','',antDager,poeng,poeng]); sheet.push(['Antall kontroller', antKontroller]);

  const wb = XLSX.utils.book_new(); const ws = XLSX.utils.aoa_to_sheet(sheet);
  XLSX.utils.book_append_sheet(wb, ws, 'Eksport ' + pick);
  XLSX.writeFile(wb, `kontrollert_${pick}.xlsx`);
});

export async function renderArchive() {
  const rows = await fetchControls();
  const div = els.archive; div.innerHTML = '';
  const byMonth = {};
  rows.forEach(c => {
    const m = new Date(c.created_at).toLocaleDateString('nb-NO', { year: 'numeric', month: 'long' });
    (byMonth[m] = byMonth[m] || []).push(c);
  });
  Object.keys(byMonth).sort().reverse().forEach(month => {
    const el = document.createElement('div'); el.className = 'card'; el.innerHTML = '<b>' + sanitize(month) + '</b>'; div.appendChild(el);
    byMonth[month].forEach(c => {
      const data = c.data || {};
      const inner = document.createElement('div'); inner.className = 'card';
      inner.innerHTML = `
        <b>${sanitize(data.navn || '')}</b> – ${new Date(c.created_at).toLocaleDateString('nb-NO')}
        <div class="help" style="margin:6px 0">${(data.tariff || []).map(t => `${sanitize(t.music)} • ${sanitize(t.venue)} • ${sanitize(t.kvm || '')} kvm ${t.seter ? ('• ' + sanitize(t.seter) + ' seter • ') : '• '}${sanitize(t.dager || '')} dager`).join('<br>')}</div>
        <div class="row" style="gap:8px">
          <button type="button" class="btn-gray" style="width:auto">Slett</button>
        </div>`;
      inner.querySelector('button').addEventListener('click', async () => {
        if (!confirm('Slette denne kontrollen?')) return;
        await supa.from('controls').delete().eq('id', c.id);
        renderArchive();
      });
      div.appendChild(inner);
    });
  });
}