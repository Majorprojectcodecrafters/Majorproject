import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardRoute = () => {
    if (!user) return '/';
    if (user.role === 'TEACHER') return '/dashboard';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    if (user.role === 'STUDENT') return '/student/papers';
    return '/';
  };

  const getProfileRoute = () => {
    if (!user) return '/';
    if (user.role === 'TEACHER') return '/teacher/profile';
    if (user.role === 'STUDENT') return '/student/profile';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    return '/';
  };

  const dashboardRoute = getDashboardRoute();
  const profileRoute = getProfileRoute();

  return (
    <nav className="border-b border-slate-200 bg-white shadow-sm select-none">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* QPGen Brand Logo (Routes directly to Dashboard) */}
        <Link 
          to={dashboardRoute} 
          className="text-2xl font-extrabold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1.5"
          title="Go to Dashboard"
        >
          <span>QPGen</span>
        </Link>

        {user && (
          <div className="flex items-center gap-6">
            {/* Center Navigation Links (Without Dashboard or Standalone Profile) */}
            <div className="flex flex-wrap items-center gap-5 text-sm font-semibold">
              {user.role === 'TEACHER' && (
                <>
                  <Link to="/teacher/students" className="text-slate-600 hover:text-blue-600 transition-colors">
                    Your Students
                  </Link>
                  <Link to="/generator" className="text-slate-600 hover:text-blue-600 transition-colors">
                    Generate QP
                  </Link>
                  <Link to="/teacher/results/create" className="text-slate-600 hover:text-blue-600 transition-colors">
                    Results
                  </Link>
                  <Link to="/teacher/quiz" className="text-slate-600 hover:text-blue-600 transition-colors">
                    Quizzes
                  </Link>
                  <Link to="/manage/announcements" className="text-purple-700 hover:text-purple-900 font-bold">
                    Announcements
                  </Link>
                  <Link to="/admin/knowledge-base" className="text-slate-600 hover:text-blue-600 transition-colors">
                    Knowledge Base
                  </Link>
                </>
              )}

              {user.role === 'ADMIN' && (
                <>
                  <Link to="/admin/users" className="text-purple-700 hover:text-purple-900 font-bold">
                    Manage Users
                  </Link>
                  <Link to="/admin/allocations" className="text-slate-600 hover:text-blue-600 transition-colors">
                    Allocations
                  </Link>
                  <Link to="/manage/announcements" className="text-purple-700 hover:text-purple-900 font-bold">
                    Announcements
                  </Link>
                  <Link to="/admin/knowledge-base" className="text-slate-600 hover:text-blue-600 transition-colors">
                    Student Library
                  </Link>
                </>
              )}

              {user.role === 'STUDENT' && (
                <>
                  <Link to="/student/papers" className="text-slate-600 hover:text-blue-600 transition-colors">
                    Papers
                  </Link>
                  <Link to="/student/practice" className="text-purple-700 hover:text-purple-900 font-bold bg-purple-50 px-2.5 py-1 rounded-lg">
                    Practice (MHT-CET)
                  </Link>
                  <Link to="/student/announcements" className="text-purple-700 hover:text-purple-900 font-bold">
                    Announcements
                  </Link>
                  <Link to="/student/materials" className="text-slate-600 hover:text-blue-600 transition-colors">
                    Study Materials
                  </Link>
                  <Link to="/student/results" className="text-slate-600 hover:text-blue-600 transition-colors">
                    Results
                  </Link>
                  <Link to="/student/quizzes" className="text-slate-600 hover:text-blue-600 transition-colors">
                    Quizzes
                  </Link>
                </>
              )}
            </div>

            {/* Merged User Profile Section & Integrated Logout */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-2xl shadow-xs">
              <Link
                to={profileRoute}
                className="flex items-center gap-2.5 px-2.5 py-1 rounded-xl hover:bg-white hover:shadow-xs transition-all"
                title="View Profile"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs uppercase">
                  {user.name ? user.name[0] : 'U'}
                </div>
                <div className="text-left">
                  <p className="font-bold text-xs text-slate-900 leading-tight truncate max-w-[120px]">{user.name}</p>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{user.role}</p>
                </div>
              </Link>

              <div className="h-5 w-px bg-slate-200"></div>

              <button
                onClick={handleLogout}
                className="px-2.5 py-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                title="Logout"
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
