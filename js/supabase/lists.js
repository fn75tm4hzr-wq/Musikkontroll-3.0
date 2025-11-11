// Lagre og hente lister fra Excel-import
import { supa } from '../main.js';
import { currentUser } from './auth.js';
import { toast } from '../ui/toast.js';
import { renderDashboard } from '../features/excel.js';

export async function saveList(name, items) {
  const user = await currentUser();
  if (!user) { toast('Innlogging kreves'); return; }
  const { error } = await supa.from('lists').insert({ user_id: user.id, name, items });
  if (error) { console.error(error); toast('Kunne ikke lagre liste'); return; }
  toast('Liste importert');
  await renderDashboard();
}

export async function fetchLists() {
  const { data, error } = await supa.from('lists').select('*').order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return data;
}