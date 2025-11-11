// Lagre og hente kontroller fra Supabase
import { supa } from '../main.js';
import { currentUser } from './auth.js';
import { toast } from '../ui/toast.js';
import { generatePDF } from '../features/pdf.js';
import { renderArchive } from '../features/archive.js';

export async function saveControl(status) {
  const user = await currentUser();
  if (!user) { toast('Innlogging kreves'); return; }
  const payload = window.getFormData();
  const { error } = await supa.from('controls').insert({ 
    user_id: user.id, 
    orgnr: payload.orgnr || null, 
    data: payload, 
    status 
  });
  if (error) { console.error(error); toast('Kunne ikke lagre'); return; }
  toast(status === 'sent' ? 'Sendt' : 'Lagret');
  if (status === 'sent') {
    await generatePDF(payload);
    await renderArchive();
  }
}

export async function fetchControls() {
  const { data, error } = await supa.from('controls').select('*').order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return data;
}