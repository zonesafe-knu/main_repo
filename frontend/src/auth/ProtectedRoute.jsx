import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const companyCode = localStorage.getItem('companyCode');

  if (!companyCode) {
    return <Navigate to="/" replace />;
  }

  return children;
}
