import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCatalogo, criarReserva, ApiError } from '../api';
import type { Catalogo, Kit, ReservaCriada } from '../types';
import { Header } from '../components/Header';
import { Loading, Spinner } from '../components/Spinner';
import { Calendar } from '../components/Calendar';
import { toast } from '../components/Toast';
import { money, fmtData, soDigitos } from '../lib/format';

export function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cat, setCat] = useState<Catalogo | null>(null);
  const [kit, setKit] = useState<Kit | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  // form
  const [data, setData] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState('dia');
  const [montagem, setMontagem] = useState(false);
  const [distancia, setDistancia] = useState(0);
  const [endereco, setEndereco] = useState('');
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [metodo, setMetodo] = useState<'pix' | 'mercadopago'>('pix');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ReservaCriada | null>(null);

  useEffect(() => {
    getCatalogo()
      .then((c) => {
        setCat(c);
        const k = c.kits.find((x) => String(x.id) === String(id)) || null;
        setKit(k);
        if (c.metodos_pagamento.length && !c.metodos_pagamento.includes('pix')) setMetodo('mercadopago');
        if (!k) setErro('Kit não encontrado.');
      })
      .catch(() => setErro('Não foi possível carregar o kit.'))
      .finally(() => setLoading(false));
  }, [id]);

  const indisponiveis = useMemo(() => new Set(cat?.datas_indisponiveis || []), [cat]);
  const taxas = cat?.taxas;

  const taxaEntrega = distancia > 0 && taxas ? taxas.entrega_base + taxas.entrega_km * distancia : 0;
  const taxaMontagem = montagem && taxas ? taxas.montagem : 0;
  const total = (kit?.preco_locacao || 0) + taxaEntrega + taxaMontagem;

  async function enviar() {
    if (!kit) return;
    if (!data) return toast('Escolha uma data.');
    if (nome.trim().length < 2) return toast('Informe seu nome.');
    if (soDigitos(whatsapp).length < 10) return toast('Informe um WhatsApp válido com DDD.');
    if (distancia > 0 && !endereco.trim()) return toast('Informe o endereço para entrega.');

    setEnviando(true);
    try {
      const res = await criarReserva({
        kit_id: kit.id,
        data_evento: data,
        periodo,
        cliente_nome: nome.trim(),
        cliente_whatsapp: soDigitos(whatsapp),
        endereco: endereco.trim(),
        distancia_km: distancia,
        quer_montagem: montagem,
        metodo_pagamento: metodo,
      });
      if (res.pagamento.tipo === 'mercadopago' && res.pagamento.init_point) {
        setResultado(res);
        setTimeout(() => { window.location.href = (res.pagamento as { init_point: string }).init_point; }, 1200);
      } else {
        setResultado(res);
      }
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Falha ao reservar. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  if (loading) return (<><Header nome={cat?.nome_negocio} /><main><div className="container"><Loading /></div></main></>);
  if (erro || !kit) return (
    <><Header nome={cat?.nome_negocio} /><main><div className="container">
      <div className="alert">{erro || 'Kit não encontrado.'}</div>
      <Link to="/" className="btn btn-primary">Voltar aos kits</Link>
    </div></main></>
  );

  if (resultado) return (<><Header nome={cat?.nome_negocio} /><main><div className="container"><Pagamento res={resultado} waContato={''} /></div></main></>);

  return (
    <>
      <Header nome={cat?.nome_negocio} />
      <main>
        <div className="container">
          <button className="link-back" onClick={() => navigate('/')}>← Voltar aos kits</button>
          <div className="booking">
            <div>
              <div className="card">
                {kit.tema && <div className="tema">{kit.tema}</div>}
                <div style={{ fontSize: 22, fontWeight: 800, margin: '2px 0 6px' }}>{kit.nome}</div>
                <div className="kit-desc">{kit.descricao}</div>
                {kit.itens.length > 0 && (
                  <ul className="steps" style={{ marginTop: 10 }}>
                    {kit.itens.map((it, i) => <li key={i}>{it}</li>)}
                  </ul>
                )}
              </div>

              <div className="card">
                <h3>1. Escolha a data</h3>
                <Calendar
                  indisponiveis={indisponiveis}
                  antecedenciaDias={cat?.antecedencia_min_dias ?? 2}
                  value={data}
                  onChange={setData}
                />
                <div className="hint">Datas riscadas já estão reservadas. Antecedência mínima: {cat?.antecedencia_min_dias ?? 2} dia(s).</div>
                <div className="field" style={{ marginTop: 12 }}>
                  <label className="lbl">Período</label>
                  <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                    <option value="dia">Dia todo</option>
                    <option value="manha">Manhã</option>
                    <option value="tarde">Tarde</option>
                    <option value="noite">Noite</option>
                  </select>
                </div>
              </div>

              <div className="card">
                <h3>2. Entrega e montagem</h3>
                <div className="field switch">
                  <div>
                    <b style={{ fontSize: 14 }}>Quero montagem no local</b>
                    <small>+ {money(taxas?.montagem || 0)} — a gente monta e desmonta pra você.</small>
                  </div>
                  <button type="button" className={'toggle' + (montagem ? ' on' : '')} aria-pressed={montagem} onClick={() => setMontagem((v) => !v)} />
                </div>
                <div className="field">
                  <label className="lbl">Distância aproximada até o evento (km)</label>
                  <input type="number" min={0} step={1} inputMode="numeric" placeholder="Ex: 6"
                    value={distancia || ''} onChange={(e) => setDistancia(Math.max(0, Number(e.target.value) || 0))} />
                  <div className="hint">Entrega = {money(taxas?.entrega_base || 0)} + {money(taxas?.entrega_km || 0)}/km. Deixe 0 se for retirar.</div>
                </div>
                <div className="field">
                  <label className="lbl">Endereço do evento</label>
                  <input type="text" placeholder="Rua, número, bairro" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
                </div>
              </div>

              <div className="card">
                <h3>3. Seus dados</h3>
                <div className="row2">
                  <div className="field"><label className="lbl">Seu nome</label>
                    <input type="text" placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} /></div>
                  <div className="field"><label className="lbl">WhatsApp</label>
                    <input type="tel" inputMode="tel" placeholder="(11) 99999-8888" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></div>
                </div>
                <div className="field">
                  <label className="lbl">Forma de pagamento</label>
                  <div className="opts">
                    {(cat?.metodos_pagamento || ['pix']).includes('pix') && (
                      <label className={'opt' + (metodo === 'pix' ? ' on' : '')} onClick={() => setMetodo('pix')}>
                        <span className="dot" /><span>💠 Pix (na hora)</span>
                      </label>
                    )}
                    {(cat?.metodos_pagamento || []).includes('mercadopago') && (
                      <label className={'opt' + (metodo === 'mercadopago' ? ' on' : '')} onClick={() => setMetodo('mercadopago')}>
                        <span className="dot" /><span>💳 Cartão / Mercado Pago</span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card summary-card">
              <h3>Resumo</h3>
              <div className="sumline"><span className="muted">Kit</span><span>{money(kit.preco_locacao)}</span></div>
              <div className="sumline"><span className="muted">Data</span><span>{data ? fmtData(data) : '—'}</span></div>
              <div className="sumline"><span className="muted">Entrega</span><span>{money(taxaEntrega)}</span></div>
              <div className="sumline"><span className="muted">Montagem</span><span>{money(taxaMontagem)}</span></div>
              <div className="sumline total"><span>Total</span><span>{money(total)}</span></div>
              <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} disabled={!data || enviando} onClick={enviar}>
                {enviando ? <><Spinner small /> Reservando…</> : !data ? 'Escolha uma data' : `Reservar • ${money(total)}`}
              </button>
              <div className="hint" style={{ textAlign: 'center', marginTop: 8 }}>Você confirma o pagamento na próxima etapa.</div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function Pagamento({ res }: { res: ReservaCriada; waContato: string }) {
  if (res.pagamento.tipo === 'mercadopago') {
    return (
      <div className="pay-wrap">
        <div className="pay-emoji">💳</div>
        <h2 style={{ margin: '8px 0' }}>Quase lá!</h2>
        <p className="lead">Reserva <b>{res.reserva_id}</b> criada. Conclua o pagamento no Mercado Pago.</p>
        <a href={res.pagamento.init_point} className="btn btn-primary btn-block">Ir para o pagamento ({money(res.valor_total)})</a>
        <p className="hint" style={{ marginTop: 12 }}>Sua data fica reservada. Assim que o pagamento é aprovado, você recebe a confirmação no WhatsApp.</p>
      </div>
    );
  }
  const pix = res.pagamento;
  const copiar = async () => {
    try { await navigator.clipboard.writeText(pix.pix_copia_cola); toast('Código Pix copiado ✅'); }
    catch { toast('Selecione o código e copie manualmente.'); }
  };
  return (
    <div className="pay-wrap">
      <div className="pay-emoji">💠</div>
      <h2 style={{ margin: '8px 0' }}>Pague com Pix pra confirmar</h2>
      <p className="lead">Reserva <b>{res.reserva_id}</b> — {res.resumo.kit_nome} em {fmtData(res.resumo.data_evento)}</p>
      <div className="card" style={{ textAlign: 'left' }}>
        <div className="sumline total" style={{ border: 'none', margin: 0, padding: '0 0 6px' }}>
          <span>Total</span><span>{money(res.valor_total)}</span>
        </div>
        <div style={{ fontWeight: 700, fontSize: 13, margin: '6px 0 4px' }}>Pix Copia e Cola</div>
        <div className="pix-code">{pix.pix_copia_cola}</div>
        <button className="btn btn-primary btn-block" onClick={copiar}>Copiar código Pix</button>
        <ol className="steps" style={{ marginTop: 14 }}>
          <li>Abra o app do seu banco e escolha <b>Pix › Copia e Cola</b>.</li>
          <li>Cole o código e confirme o valor de {money(res.valor_total)}.</li>
          <li>Pronto! A confirmação chega no seu WhatsApp.</li>
        </ol>
      </div>
      <Link to="/" className="btn btn-ghost btn-block" style={{ marginTop: 12 }}>Voltar ao início</Link>
    </div>
  );
}
