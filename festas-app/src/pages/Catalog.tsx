import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCatalogo, isApiConfigured } from '../api';
import type { Catalogo } from '../types';
import { Header } from '../components/Header';
import { Loading } from '../components/Spinner';
import { money } from '../lib/format';

export function Catalog() {
  const [data, setData] = useState<Catalogo | null>(null);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isApiConfigured()) {
      setErro('config');
      setLoading(false);
      return;
    }
    getCatalogo()
      .then(setData)
      .catch(() => setErro('conn'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header nome={data?.nome_negocio} />
      <main>
        <div className="container">
          {loading && <Loading label="Carregando kits…" />}

          {!loading && erro === 'config' && (
            <div className="notice">
              ⚙️ Configure a URL da API em <b>festas/festas-config.js</b> (campo <code>window.__FESTAS_API__</code>) para o catálogo carregar.
            </div>
          )}
          {!loading && erro === 'conn' && (
            <div className="alert">Não foi possível carregar os kits agora. Tente novamente em instantes.</div>
          )}

          {!loading && data && (
            <>
              <h1>Escolha o seu kit de festa 🎉</h1>
              <p className="lead">
                Kits completos com montagem opcional e arcos de balão. Veja a disponibilidade na agenda e reserve com Pix ou cartão.
              </p>
              {data.kits.length === 0 ? (
                <div className="center">Nenhum kit disponível no momento.</div>
              ) : (
                <div className="grid-kits">
                  {data.kits.map((k) => (
                    <div key={k.id} className="kit-card">
                      <div
                        className="kit-thumb"
                        style={k.imagem_url ? { backgroundImage: `url('${k.imagem_url}')` } : undefined}
                      >
                        {k.imagem_url ? '' : '🎉'}
                      </div>
                      <div className="kit-info">
                        {k.tema && <div className="tema">{k.tema}</div>}
                        <div className="kit-nome">{k.nome}</div>
                        <div className="kit-desc">{k.descricao}</div>
                        <div className="preco">
                          {money(k.preco_locacao)} <small>/ locação</small>
                        </div>
                        <Link to={`/kit/${k.id}`} className="btn btn-primary" style={{ marginTop: 8, textAlign: 'center' }}>
                          Reservar
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
