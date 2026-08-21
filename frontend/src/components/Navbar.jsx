import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link to="/" className="text-2xl font-bold text-blue-600">
          QPGen
        </Link>

        {user && (
          <div className="flex items-center gap-6">
            <div className="text-sm">
              <p className="font-medium text-gray-900">{user.name}</p>
              <p className="text-gray-500">{user.role}</p>
            </div>

            <div className="flex gap-3">
              {user.role === 'TEACHER' && (
                <>
                  <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
                    Dashboard
                  </Link>
                  <Link to="/generator" className="text-gray-600 hover:text-gray-900">
                    Generate
                  </Link>
                  <Link to="/admin/knowledge-base" className="text-gray-600 hover:text-gray-900">
                    Knowledge Base
                  </Link>
                </>
              )}

              {user.role === 'ADMIN' && (
                <>
                  <Link to="/admin/dashboard" className="text-gray-600 hover:text-gray-900">
                    Admin
                  </Link>
                  <Link to="/admin/knowledge-base" className="text-gray-600 hover:text-gray-900">
                    Student Library
                  </Link>
                </>
              )}

              {user.role === 'STUDENT' && (
                <>
                  <Link to="/student/papers" className="text-gray-600 hover:text-gray-900">
                    Papers
                  </Link>
                  <Link to="/student/materials" className="text-gray-600 hover:text-gray-900">
                    Study Materials
                  </Link>
                  <Link to="/student/results" className="text-gray-600 hover:text-gray-900">
                    Results
                  </Link>
                </>
              )}

              <button
                onClick={handleLogout}
                className="rounded bg-red-50 px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-100"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
