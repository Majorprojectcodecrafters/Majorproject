import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess =
    !allowedRoles ||
    allowedRoles.includes(user.role) ||
    (user.role === 'DEVELOPER' && (allowedRoles.includes('ADMIN') || allowedRoles.includes('TEACHER')));

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
