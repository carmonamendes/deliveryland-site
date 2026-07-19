import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../../api';

const TABS = [
  { to: '/admin/reservas', label: 'Reservas' },
  { to: '/admin/kits', label: 'Kits' },
  { to: '/admin/config', label: 'Configurações' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const sair = () => {
    auth.clear();
    navigate('/admin');
  };
  return (
    <>
      <header className="app-header">
        <div className="container">
          <Link to="/admin/reservas" className="brand">
            <span className="logo">🎈</span>
            <span><small>Painel</small>Administração</span>
          </Link>
          <button className="btn btn-ghost btn-sm" onClick={sair}>Sair</button>
        </div>
      </header>
      <main>
        <div className="container">
          <nav className="admin-nav">
            {TABS.map((t) => (
              <Link key={t.to} to={t.to} className={loc.pathname === t.to ? 'active' : ''}>
                {t.label}
              </Link>
            ))}
          </nav>
          {children}
        </div>
      </main>
    </>
  );
}
