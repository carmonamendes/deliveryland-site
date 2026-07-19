import { useState } from 'react';

interface Props {
  indisponiveis: Set<string>;
  antecedenciaDias: number;
  value: string | null;
  onChange: (iso: string) => void;
}

const DOW = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function isoOf(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function Calendar({ indisponiveis, antecedenciaDias, value, onChange }: Props) {
  const now = new Date();
  const [cursor, setCursor] = useState(new Date(now.getFullYear(), now.getMonth(), 1));

  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const startDow = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const monthName = cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + antecedenciaDias);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < startDow; i++) cells.push(<div key={`e${i}`} className="cal-day empty" />);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(y, m, d);
    const iso = isoOf(y, m, d);
    const past = date < minDate;
    const off = indisponiveis.has(iso);
    const disabled = past || off;
    const sel = value === iso;
    const cls = 'cal-day ' + (disabled ? 'off' : 'free' + (sel ? ' sel' : ''));
    cells.push(
      <div
        key={iso}
        className={cls}
        role={disabled ? undefined : 'button'}
        tabIndex={disabled ? undefined : 0}
        onClick={disabled ? undefined : () => onChange(iso)}
        onKeyDown={disabled ? undefined : (e) => (e.key === 'Enter' || e.key === ' ') && onChange(iso)}
      >
        {d}
      </div>,
    );
  }

  return (
    <div>
      <div className="cal-head">
        <button type="button" className="cal-nav" aria-label="Mês anterior" onClick={() => setCursor(new Date(y, m - 1, 1))}>‹</button>
        <strong>{monthName}</strong>
        <button type="button" className="cal-nav" aria-label="Próximo mês" onClick={() => setCursor(new Date(y, m + 1, 1))}>›</button>
      </div>
      <div className="cal-grid">
        {DOW.map((d, i) => (
          <div key={i} className="cal-dow">{d}</div>
        ))}
        {cells}
      </div>
    </div>
  );
}
