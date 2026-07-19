import { useEffect, useState, useCallback } from 'react';
import { listarKits, criarKit, atualizarKit, excluirKit, ApiError } from '../../api';
import type { KitAdmin } from '../../types';
import { AdminShell } from './AdminShell';
import { Loading, Spinner } from '../../components/Spinner';
import { toast } from '../../components/Toast';
import { money } from '../../lib/format';

interface FormState {
  id?: number;
  nome: string;
  tema: string;
  descricao: string;
  preco_locacao: string;
  imagem_url: string;
  itens: string; // um por linha
  ativo: boolean;
}

const vazio: FormState = { nome: '', tema: '', descricao: '', preco_locacao: '', imagem_url: '', itens: '', ativo: true };

export function AdminKits() {
  const [kits, setKits] = useState<KitAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await listarKits();
      setKits(r.kits);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Erro ao carregar.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  function abrirNovo() { setForm({ ...vazio }); }
  function abrirEdicao(k: KitAdmin) {
    setForm({
      id: k.id, nome: k.nome, tema: k.tema, descricao: k.descricao,
      preco_locacao: String(k.preco_locacao), imagem_url: k.imagem_url,
      itens: k.itens.join('\n'), ativo: k.ativo,
    });
  }

  async function salvar() {
    if (!form) return;
    if (form.nome.trim().length < 2) return toast('Informe o nome do kit.');
    const preco = Number(String(form.preco_locacao).replace(',', '.'));
    if (!(preco >= 0)) return toast('Preço inválido.');
    const payload = {
      nome: form.nome.trim(),
      tema: form.tema.trim(),
      descricao: form.descricao.trim(),
      preco_locacao: preco,
      imagem_url: form.imagem_url.trim(),
      itens: form.itens.split('\n').map((s) => s.trim()).filter(Boolean),
      ativo: form.ativo,
    };
    setSaving(true);
    try {
      if (form.id) await atualizarKit(form.id, payload);
      else await criarKit(payload);
      toast('Kit salvo ✅');
      setForm(null);
      await carregar();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function alternarAtivo(k: KitAdmin) {
    try {
      await atualizarKit(k.id, { ativo: !k.ativo });
      await carregar();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Erro.');
    }
  }

  async function excluir(k: KitAdmin) {
    if (!window.confirm(`Excluir o kit "${k.nome}"?`)) return;
    try {
      await excluirKit(k.id);
      toast('Kit excluído');
      await carregar();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Erro ao excluir.');
    }
  }

  return (
    <AdminShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2>Kits</h2>
        <button className="btn btn-primary" onClick={abrirNovo}>+ Novo kit</button>
      </div>

      {loading ? (
        <Loading />
      ) : kits.length === 0 ? (
        <div className="center">Nenhum kit cadastrado. Clique em “Novo kit”.</div>
      ) : (
        <div className="grid-kits">
          {kits.map((k) => (
            <div key={k.id} className="kit-card">
              <div className="kit-thumb" style={k.imagem_url ? { backgroundImage: `url('${k.imagem_url}')` } : undefined}>
                {k.imagem_url ? '' : '🎉'}
              </div>
              <div className="kit-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {k.tema && <span className="tema">{k.tema}</span>}
                  <span className={`tag ${k.ativo ? 'PAGO' : 'CANCELADO'}`}>{k.ativo ? 'Ativo' : 'Inativo'}</span>
                </div>
                <div className="kit-nome">{k.nome}</div>
                <div className="kit-desc">{k.descricao}</div>
                <div className="preco">{money(k.preco_locacao)}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => abrirEdicao(k)}>Editar</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => alternarAtivo(k)}>{k.ativo ? 'Desativar' : 'Ativar'}</button>
                  <button className="btn btn-sm btn-danger-outline" onClick={() => excluir(k)}>Excluir</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <div className="modal-backdrop" onClick={() => !saving && setForm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 14 }}>{form.id ? 'Editar kit' : 'Novo kit'}</h3>
            <div className="field"><label className="lbl">Nome</label>
              <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div className="row2">
              <div className="field"><label className="lbl">Tema</label>
                <input value={form.tema} onChange={(e) => setForm({ ...form, tema: e.target.value })} /></div>
              <div className="field"><label className="lbl">Preço da locação (R$)</label>
                <input inputMode="decimal" value={form.preco_locacao} onChange={(e) => setForm({ ...form, preco_locacao: e.target.value })} /></div>
            </div>
            <div className="field"><label className="lbl">Descrição</label>
              <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
            <div className="field"><label className="lbl">URL da imagem</label>
              <input placeholder="https://…" value={form.imagem_url} onChange={(e) => setForm({ ...form, imagem_url: e.target.value })} /></div>
            <div className="field"><label className="lbl">Itens (um por linha)</label>
              <textarea placeholder={'Painel\nMesa\nTorre de doces'} value={form.itens} onChange={(e) => setForm({ ...form, itens: e.target.value })} /></div>
            <div className="field switch">
              <b style={{ fontSize: 14 }}>Ativo no catálogo</b>
              <button type="button" className={'toggle' + (form.ativo ? ' on' : '')} aria-pressed={form.ativo} onClick={() => setForm({ ...form, ativo: !form.ativo })} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} disabled={saving} onClick={() => setForm(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 2 }} disabled={saving} onClick={salvar}>
                {saving ? <><Spinner small /> Salvando…</> : 'Salvar kit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
