import { Link } from 'react-router-dom';

export function Header({ nome = 'Ateliê Abelhinha' }: { nome?: string }) {
  return (
    <header className="app-header">
      <div className="container">
        <Link to="/" className="brand">
          <span className="logo">🎈</span>
          <span>
            <small>Locação</small>
            {nome}
          </span>
        </Link>
        <Link to="/admin" className="header-link">Área do administrador</Link>
      </div>
    </header>
  );
}
