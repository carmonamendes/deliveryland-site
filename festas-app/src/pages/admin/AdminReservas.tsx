import { useEffect, useState, useCallback } from 'react';
import { listarReservas, confirmarReserva, cancelarReserva, getDashboard, ApiError } from '../../api';
import type { Reserva, Dashboard } from '../../types';
import { AdminShell } from './AdminShell';
import { Loading } from '../../components/Spinner';
import { toast } from '../../components/Toast';
import { money, fmtData, soDigitos } from '../../lib/format';

export function AdminReservas() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [filtro, setFiltro] = useState('TODAS');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const carregar = useCallback(async (f: string) => {
    setLoading(true);
    try {
      const [r, d] = await Promise.all([listarReservas(f), getDashboard()]);
      setReservas(r.reservas);
      setDash(d);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Erro ao carregar.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(filtro); }, [filtro, carregar]);

  async function acao(tipo: 'confirmar' | 'cancelar', r: Reserva) {
    const msg = tipo === 'confirmar'
      ? `Confirmar o pagamento da reserva ${r.id}?`
      : `Cancelar a reserva ${r.id}? A data será liberada.`;
    if (!window.confirm(msg)) return;
    setBusy(r.id);
    try {
      if (tipo === 'confirmar') await confirmarReserva(r.id);
      else await cancelarReserva(r.id);
      toast(tipo === 'confirmar' ? 'Reserva confirmada ✅' : 'Reserva cancelada');
      await carregar(filtro);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Erro na operação.');
    } finally {
      setBusy('');
    }
  }

  return (
    <AdminShell>
      {dash && (
        <div className="stats">
          <div className="stat"><b>{dash.stats.total}</b><span>reservas</span></div>
          <div className="stat"><b>{dash.stats.aguardando}</b><span>aguardando</span></div>
          <div className="stat"><b>{dash.stats.pagas}</b><span>pagas</span></div>
          <div className="stat"><b>{money(dash.stats.receita)}</b><span>recebido</span></div>
        </div>
      )}

      <div className="field" style={{ maxWidth: 260 }}>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="TODAS">Todas as reservas</option>
          <option value="AGUARDANDO_PAGAMENTO">Aguardando pagamento</option>
          <option value="PAGO">Pagas</option>
          <option value="CANCELADO">Canceladas</option>
        </select>
      </div>

      {loading ? (
        <Loading />
      ) : reservas.length === 0 ? (
        <div className="center">Nenhuma reserva{filtro !== 'TODAS' ? ' com esse status' : ''}.</div>
      ) : (
        <div className="card table-scroll">
          <table>
            <thead>
              <tr>
                <th>Reserva</th><th>Data</th><th>Kit</th><th>Cliente</th><th>Pgto</th>
                <th className="right">Total</th><th>Status</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {reservas.map((r) => (
                <tr key={r.id}>
                  <td><b>{r.id}</b><br /><span className="muted" style={{ fontSize: 11 }}>{new Date(r.criado_em).toLocaleDateString('pt-BR')}</span></td>
                  <td>{fmtData(r.data_evento)}<br /><span className="muted">{r.periodo}</span></td>
                  <td>{r.kit_nome}</td>
                  <td>
                    {r.cliente_nome}<br />
                    <a href={`https://wa.me/${soDigitos(r.cliente_whatsapp)}`} target="_blank" rel="noreferrer" className="muted">{r.cliente_whatsapp}</a>
                    {r.endereco && <><br /><span className="muted" style={{ fontSize: 12 }}>{r.endereco}</span></>}
                  </td>
                  <td>{r.metodo_pagamento}</td>
                  <td className="right">{money(r.valor_total)}</td>
                  <td><span className={`tag ${r.status}`}>{r.status.replace(/_/g, ' ')}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {r.status === 'AGUARDANDO_PAGAMENTO' && (
                        <button className="btn btn-sm btn-ok" disabled={busy === r.id} onClick={() => acao('confirmar', r)}>✓ Confirmar</button>
                      )}
                      {(r.status === 'AGUARDANDO_PAGAMENTO' || r.status === 'PAGO') && (
                        <button className="btn btn-sm btn-danger-outline" disabled={busy === r.id} onClick={() => acao('cancelar', r)}>Cancelar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
