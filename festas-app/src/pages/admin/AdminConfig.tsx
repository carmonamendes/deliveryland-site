import { useEffect, useState } from 'react';
import { getConfig, salvarConfig, ApiError } from '../../api';
import type { ConfigNegocio } from '../../types';
import { AdminShell } from './AdminShell';
import { Loading, Spinner } from '../../components/Spinner';
import { toast } from '../../components/Toast';

export function AdminConfig() {
  const [cfg, setCfg] = useState<ConfigNegocio | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getConfig()
      .then((r) => setCfg(r.config))
      .catch((e) => toast(e instanceof ApiError ? e.message : 'Erro ao carregar.'))
      .finally(() => setLoading(false));
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!cfg) return;
    setSaving(true);
    try {
      const r = await salvarConfig({
        nome_negocio: cfg.nome_negocio,
        taxa_montagem: Number(cfg.taxa_montagem),
        taxa_entrega_base: Number(cfg.taxa_entrega_base),
        taxa_entrega_km: Number(cfg.taxa_entrega_km),
        antecedencia_min_dias: Number(cfg.antecedencia_min_dias),
      });
      setCfg(r.config);
      toast('Configurações salvas ✅');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  const set = (patch: Partial<ConfigNegocio>) => setCfg((c) => (c ? { ...c, ...patch } : c));

  return (
    <AdminShell>
      <h2 style={{ marginBottom: 12 }}>Configurações do negócio</h2>
      {loading || !cfg ? (
        <Loading />
      ) : (
        <form className="card" style={{ maxWidth: 520 }} onSubmit={salvar}>
          <div className="field">
            <label className="lbl">Nome do negócio</label>
            <input value={cfg.nome_negocio} onChange={(e) => set({ nome_negocio: e.target.value })} />
          </div>
          <div className="row2">
            <div className="field">
              <label className="lbl">Taxa de montagem (R$)</label>
              <input inputMode="decimal" value={cfg.taxa_montagem} onChange={(e) => set({ taxa_montagem: e.target.value as unknown as number })} />
            </div>
            <div className="field">
              <label className="lbl">Antecedência mínima (dias)</label>
              <input inputMode="numeric" value={cfg.antecedencia_min_dias} onChange={(e) => set({ antecedencia_min_dias: e.target.value as unknown as number })} />
            </div>
          </div>
          <div className="row2">
            <div className="field">
              <label className="lbl">Entrega — taxa base (R$)</label>
              <input inputMode="decimal" value={cfg.taxa_entrega_base} onChange={(e) => set({ taxa_entrega_base: e.target.value as unknown as number })} />
            </div>
            <div className="field">
              <label className="lbl">Entrega — por km (R$)</label>
              <input inputMode="decimal" value={cfg.taxa_entrega_km} onChange={(e) => set({ taxa_entrega_km: e.target.value as unknown as number })} />
            </div>
          </div>
          <div className="hint" style={{ marginBottom: 12 }}>
            A entrega é cobrada como <b>base + (km × valor por km)</b>. Dados de Pix e Mercado Pago ficam no servidor (arquivo .env da API).
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
            {saving ? <><Spinner small /> Salvando…</> : 'Salvar configurações'}
          </button>
        </form>
      )}
    </AdminShell>
  );
}
