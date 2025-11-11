// Skriver meldinger til konsollen med tidspunkt – hjelper med feilsøking
export function log(action, data) {
  console.log(`[${new Date().toISOString()}] ${action}`, data);
}