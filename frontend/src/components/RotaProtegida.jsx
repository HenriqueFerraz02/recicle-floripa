import { Navigate } from 'react-router-dom';
import { temSessao } from '../utils/sessao';

// Telas que só abrem com login. Sem token válido, vai para o login.
export default function RotaProtegida({ children }) {
  if (!temSessao()) return <Navigate to='/login' replace />;
  return children;
}
