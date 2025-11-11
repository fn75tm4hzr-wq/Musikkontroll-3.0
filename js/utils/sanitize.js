// Beskytter mot farlig tekst (XSS)
export function sanitize(str = '') {
  return String(str).replace(/[<>]/g, c => ({'<':'&lt;','>':'&gt;'}[c]));
}