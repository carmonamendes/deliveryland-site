export const money = (n: number): string =>
  'R$ ' + (Number(n) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtData = (iso: string): string => {
  if (!iso) return '—';
  try {
    return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR');
  } catch {
    return iso;
  }
};

export const soDigitos = (s: string): string => (s || '').replace(/\D/g, '');
