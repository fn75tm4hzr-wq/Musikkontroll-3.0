// Lag PDF med jsPDF – sender til nedlasting
import { supa } from '../main.js';
import { sanitize } from '../utils/sanitize.js';

async function imgDataUrl(path) {
  const r = await fetch(path);
  const b = await r.blob();
  return new Promise(res => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.readAsDataURL(b);
  });
}

function firstNameFromSession(session) {
  const email = session?.user?.email || '';
  const guess = email.split('@')[0].split(/[.\-_]/)[0];
  return (session?.user?.user_metadata?.full_name?.split(' ')[0]) ||
         (guess ? guess.charAt(0).toUpperCase() + guess.slice(1) : '');
}

export async function generatePDF(data) {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) { alert('PDF-bibliotek mangler'); return; }
  let tono = null, gramo = null;
  try { tono = await imgDataUrl('assets/tono_logo.png'); gramo = await imgDataUrl('assets/gramo_logo.png'); } catch {}
  const { data: { session } } = await supa.auth.getSession();
  const kontrollor = firstNameFromSession(session);

  const doc = new jsPDF({ unit: 'mm', format: [72, 200] });
  let y = 8;
  if (tono || gramo) {
    const w = 26, gap = 4, x1 = 4, x2 = x1 + w + gap;
    if (tono) doc.addImage(tono, 'PNG', x1, y, w, 10, undefined, 'FAST');
    if (gramo) doc.addImage(gramo, 'PNG', x2, y, w, 10, undefined, 'FAST');
    y += 12;
  }
  doc.setFontSize(11); doc.text('Kontrollskjema for bruk av musikk', 4, y); y += 6;
  doc.setFontSize(9);
  doc.text('Besøksnavn: ' + (data.navn || ''), 4, y); y += 5;
  doc.text('Besøksadresse: ' + (data.adresse || ''), 4, y); y += 5;
  doc.text('Post: ' + (data.postnr || '') + ' ' + (data.poststed || ''), 4, y); y += 5;
  const dt = new Date();
  doc.text('Kontrollert: ' + dt.toLocaleDateString('nb-NO') + ' kl ' + dt.toLocaleTimeString('nb-NO', {hour: '2-digit', minute: '2-digit'}), 4, y); y += 5;
  doc.text('Kontrollør: ' + (kontrollor || ''), 4, y); y += 6;

  doc.setFontSize(10); doc.text('Linjer:', 4, y); y += 5; doc.setFontSize(9);
  (data.tariff || []).forEach((t, i) => {
    const parts = [
      `${i+1}. ${(t.music === 'Fremtredende musikk') ? 'Fremtredende musikk' : 'Bakgrunnsmusikk'}`,
      '• ' + (t.venue || 'Serveringssted'),
      (t.kvm ? `• ${t.kvm} kvm` : ''),
      (t.seter ? `• ${t.seter} seter` : ''),
      (t.dager ? `• ${t.dager} dager/år` : '')
    ].filter(Boolean).join(' ');
    doc.text(parts, 6, y); y += 5;
  });
  y += 2;
  doc.text('Høyttalere:', 4, y); y += 4;
  const splitH = doc.splitTextToSize(data.hoyttalere || '', 64);
  if (splitH.length) { doc.text(splitH, 4, y); y += splitH.length * 4 + 2; }
  doc.text('Kommentar:', 4, y); y += 4;
  const split = doc.splitTextToSize(data.kommentar || '', 64);
  if (split.length) { doc.text(split, 4, y); y += split.length * 4 + 2; }

  y += 4; doc.setFontSize(8); doc.text('TONO • GRAMO', 4, y); y += 4;
  doc.text('TONO – Kongens gate 12, 0153 Oslo – www.tono.no', 4, y);

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'kontroll-' + (data.orgnr || '') + '.pdf'; a.click();
}