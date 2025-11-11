// Hindrer at en funksjon kjøres for ofte (f.eks. ved søk)
export function debounce(fn, ms = 400) {
  let h;
  return (...a) => {
    clearTimeout(h);
    h = setTimeout(() => fn(...a), ms);
  };
}