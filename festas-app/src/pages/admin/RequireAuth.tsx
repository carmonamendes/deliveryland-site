import { Navigate } from 'react-router-dom';
import { auth } from '../../api';

export function RequireAuth({ children }: { children: JSX.Element }) {
  return auth.isLogged() ? children : <Navigate to="/admin" replace />;
}
