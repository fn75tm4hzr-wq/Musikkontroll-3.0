// Importer Excel-liste og vis i dashboard
import { els } from '../ui/dom.js';
import { saveList, fetchLists } from '../supabase/lists.js';
import { show } from '../ui/navigation.js';
import { addRow } from './tariff.js';
import { sanitize } from '../utils/sanitize.js';
import { debounce } from '../utils/debounce.js';

export async function importExcel(e) {
  const file = e.target.files[0]; if (!file) return;
  try {
    const reader = new FileReader();
    reader.onload = async ev => {
      const data = new Uint8Array(ev.target.result);
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.SheetNames[0];
      const ws = wb.Sheets[sheet];
      const json = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
      const head = (json[0] || []).map(s => String(s || '').trim().toLowerCase());
      const wanted = {
        org: ['orgnummer','org nr','organisasjonsnr','organisasjonsnummer','orgnr'],
        navn: ['navn','besøksnavn','bedriftsnavn','foretaksnavn'],
        gate: ['gateadresse','adresse','besøksadresse','adressse','gatenavn'],
        postnr: ['postnr','postnummer','post nr'],
        poststed: ['poststed','sted'],
        kommentar: ['kommentar','notat','note','merknad']
      };
      const idx = {};
      Object.keys(wanted).forEach(k => {
        idx[k] = head.findIndex(h => wanted[k].some(w => h === w));
      });
      const items = [];
      for (let r = 1; r < json.length; r++) {
        const row = json[r] || [];
        const get = (k) => {
          const i = idx[k]; if (i == null || i < 0) return '';
          return String(row[i] || '').trim();
        };
        const org = get('org').replace(/\s+/g, '').replace(/[^0-9]/g, '');
        const itm = {
          Orgnummer: org,
          Navn: get('navn'),
          Gateadresse: get('gate'),
          Postnr: get('postnr'),
          Poststed: get('poststed'),
          Kommentar: get('kommentar'),
          color: 0
        };
        if (itm.Navn || itm.Gateadresse) items.push(itm);
      }
      const name = (file.name || 'Liste').replace(/\.(xlsx|xls)$/i, '');
      await saveList(name, items);
    };
    reader.readAsArrayBuffer(file);
  } catch (err) {
    console.error(err);
    alert('Kunne ikke lese Excel');
  }
}

export async function renderDashboard() {
  const lists = await fetchLists();
  const d = els.listsDashboard; d.innerHTML = '';
  const q = (els.search.value || '').toLowerCase();
  lists.forEach(L => {
    const box = document.createElement('div'); box.className = 'card';
    box.innerHTML = `
      <div class="list-header"><span>${sanitize(L.name)}</span><small>${new Date(L.created_at).toLocaleDateString('nb-NO')}</small></div>
      <div class="help">${L.items.length} steder</div>
      <div style="max-height:360px;overflow:auto;border:1px solid var(--br);border-radius:10px">
        <table class="list-table">
          <thead><tr><th>Orgnummer</th><th>Besøksnavn</th><th>Gateadresse</th><th>Post</th><th>Kommentar</th><th></th></tr></thead>
          <tbody id="tbody-${L.id}"></tbody>
        </table>
      </div>`;
    d.appendChild(box);
    const tbody = $(`#tbody-${L.id}`);
    L.items.forEach((it, i) => {
      const hay = [it.Orgnummer, it.Navn, it.Gateadresse, it.Postnr, it.Poststed, it.Kommentar].join(' ').toLowerCase();
      if (q && !hay.includes(q)) return;
      const tr = document.createElement('tr'); tr.className = 'list-row';
      tr.innerHTML = `
        <td>${sanitize(it.Orgnummer || '')}</td>
        <td><strong>${sanitize(it.Navn || '')}</strong></td>
        <td>${sanitize(it.Gateadresse || '')}</td>
        <td>${sanitize((it.Postnr || '') + ' ' + (it.Poststed || ''))}</td>
        <td contenteditable
            onblur="(async()=>{ try{ const list = (await supa.from('lists').select('*').eq('id','${L.id}').single()).data; list.items[${i}].Kommentar=this.innerText; await supa.from('lists').update({ items: list.items }).eq('id','${L.id}'); }catch(e){console.error(e)} })()">
          ${sanitize(it.Kommentar || '')}
        </td>
        <td>
          <button class="btn-gray" style="width:auto" title="Start kontroll">KONTROLL</button>
        </td>`;
      tr.querySelector('button').addEventListener('click', () => {
        els.orgnr.value = it.Orgnummer || '';
        els.navn.value = it.Navn || '';
        els.besoksadresse.value = it.Gateadresse || '';
        els.besoks_postnr.value = it.Postnr || '';
        els.besoks_poststed.value = it.Poststed || '';
        els.tariffRows.innerHTML = '';
        addRow({ music: 'Bakgrunnsmusikk', venue: 'Serveringssted' });
        show('kontroll');
      });
      tbody.appendChild(tr);
    });
  });
}