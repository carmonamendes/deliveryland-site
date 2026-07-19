import { useEffect, useState } from 'react';

type Listener = (msg: string) => void;
let listener: Listener | null = null;

/** Mostra uma mensagem curta (toast). Pode ser chamada de qualquer lugar. */
export function toast(msg: string) {
  listener?.(msg);
}

export function ToastHost() {
  const [msg, setMsg] = useState('');
  useEffect(() => {
    listener = (m) => setMsg(m);
    return () => {
      listener = null;
    };
  }, []);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(''), 2600);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  return <div className="toast" role="status">{msg}</div>;
}
