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

            <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
              {user.role === 'TEACHER' && (
                <>
                  <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
                    Dashboard
                  </Link>
                  <Link to="/teacher/students" className="text-gray-600 hover:text-gray-900">
                    Your Students
                  </Link>
                  <Link to="/generator" className="text-gray-600 hover:text-gray-900">
                    Generate QP
                  </Link>
                  <Link to="/teacher/results/create" className="text-gray-600 hover:text-gray-900">
                    Results
                  </Link>
                  <Link to="/teacher/quiz" className="text-gray-600 hover:text-gray-900">
                    Quizzes
                  </Link>
                  <Link to="/manage/announcements" className="text-gray-600 hover:text-gray-900 font-bold text-purple-700">
                    Announcements
                  </Link>
                  <Link to="/admin/knowledge-base" className="text-gray-600 hover:text-gray-900">
                    Knowledge Base
                  </Link>
                  <Link to="/teacher/profile" className="text-gray-600 hover:text-gray-900">
                    My Profile
                  </Link>
                </>
              )}

              {user.role === 'ADMIN' && (
                <>
                  <Link to="/admin/dashboard" className="text-gray-600 hover:text-gray-900">
                    Admin
                  </Link>
                  <Link to="/admin/allocations" className="text-gray-600 hover:text-gray-900">
                    Allocations
                  </Link>
                  <Link to="/manage/announcements" className="text-gray-600 hover:text-gray-900 font-bold text-purple-700">
                    Announcements
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
                  <Link to="/student/practice" className="text-purple-700 hover:text-purple-900 font-bold bg-purple-50 px-2 py-1 rounded">
                    Practice (MHT-CET)
                  </Link>
                  <Link to="/student/announcements" className="text-gray-600 hover:text-gray-900 font-bold text-purple-700">
                    Announcements
                  </Link>
                  <Link to="/student/materials" className="text-gray-600 hover:text-gray-900">
                    Study Materials
                  </Link>
                  <Link to="/student/results" className="text-gray-600 hover:text-gray-900">
                    Results
                  </Link>
                  <Link to="/student/quizzes" className="text-gray-600 hover:text-gray-900">
                    Quizzes
                  </Link>
                  <Link to="/student/profile" className="text-gray-600 hover:text-gray-900">
                    My Profile
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
