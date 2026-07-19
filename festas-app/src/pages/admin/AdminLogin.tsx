import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, auth, ApiError, isApiConfigured } from '../../api';
import { Header } from '../../components/Header';
import { Spinner } from '../../components/Spinner';

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth.isLogged()) navigate('/admin/reservas', { replace: true });
  }, [navigate]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const res = await login(email.trim().toLowerCase(), senha);
      auth.set(res.token);
      navigate('/admin/reservas', { replace: true });
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Falha ao entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main>
        <div className="container" style={{ maxWidth: 400 }}>
          <h1 style={{ marginBottom: 4 }}>Entrar no painel</h1>
          <p className="lead">Acesso restrito à administração.</p>
          {!isApiConfigured() && (
            <div className="notice">⚙️ Configure a URL da API em <b>festas/festas-config.js</b>.</div>
          )}
          {erro && <div className="alert">{erro}</div>}
          <form className="card" onSubmit={entrar}>
            <div className="field">
              <label className="lbl">E-mail</label>
              <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label className="lbl">Senha</label>
              <input type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? <><Spinner small /> Entrando…</> : 'Entrar'}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
