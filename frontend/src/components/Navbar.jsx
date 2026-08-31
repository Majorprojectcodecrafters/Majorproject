import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

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
    if (user.role === 'ADMIN') return '/admin/profile';
    return '/';
  };

  const dashboardRoute = getDashboardRoute();
  const profileRoute = getProfileRoute();

  const closeMenu = () => setMobileMenuOpen(false);
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="border-b border-slate-200/90 bg-white/95 backdrop-blur-sm sticky top-0 z-40 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link 
            to={dashboardRoute} 
            onClick={closeMenu}
            className="text-2xl font-extrabold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1.5"
            title="QPGen Dashboard"
          >
            <span>{t('brandName', 'QPGen')}</span>
          </Link>

          {user && (
            <>
              {/* Desktop Navigation Links */}
              <div className="hidden md:flex items-center gap-5">
                <div className="flex items-center gap-4 text-sm font-semibold">
                  {user.role === 'TEACHER' && (
                    <>
                      <Link to="/teacher/students" className={`transition-colors ${isActive('/teacher/students') ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-blue-600'}`}>
                        {t('yourStudents', 'Your Students')}
                      </Link>
                      <Link to="/generator" className={`transition-colors ${isActive('/generator') ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-blue-600'}`}>
                        {t('generateQP', 'Generate QP')}
                      </Link>
                      <Link to="/teacher/results/create" className={`transition-colors ${isActive('/teacher/results/create') ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-blue-600'}`}>
                        {t('results', 'Results')}
                      </Link>
                      <Link to="/teacher/quiz" className={`transition-colors ${isActive('/teacher/quiz') ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-blue-600'}`}>
                        {t('quizzes', 'Quizzes')}
                      </Link>
                      <Link to="/manage/announcements" className={`transition-colors ${isActive('/manage/announcements') ? 'text-purple-900 font-bold' : 'text-purple-700 hover:text-purple-900 font-bold'}`}>
                        {t('announcements', 'Announcements')}
                      </Link>
                      <Link to="/admin/knowledge-base" className={`transition-colors ${isActive('/admin/knowledge-base') ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-blue-600'}`}>
                        {t('knowledgeBase', 'Knowledge Base')}
                      </Link>
                      <Link to="/student/library" className={`transition-colors ${isActive('/student/library') ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-blue-600'}`}>
                        {t('studentLibrary', 'Student Library')}
                      </Link>
                    </>
                  )}

                  {user.role === 'ADMIN' && (
                    <>
                      <Link to="/admin/users" className={`transition-colors ${isActive('/admin/users') ? 'text-purple-900 font-bold' : 'text-purple-700 hover:text-purple-900 font-bold'}`}>
                        {t('manageUsers', 'Manage Users')}
                      </Link>
                      <Link to="/admin/allocations" className={`transition-colors ${isActive('/admin/allocations') ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-blue-600'}`}>
                        {t('allocations', 'Allocations')}
                      </Link>
                      <Link to="/manage/announcements" className={`transition-colors ${isActive('/manage/announcements') ? 'text-purple-900 font-bold' : 'text-purple-700 hover:text-purple-900 font-bold'}`}>
                        {t('announcements', 'Announcements')}
                      </Link>
                      <Link to="/admin/knowledge-base" className={`transition-colors ${isActive('/admin/knowledge-base') ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-blue-600'}`}>
                        {t('knowledgeBase', 'Knowledge Base')}
                      </Link>
                      <Link to="/student/library" className={`transition-colors ${isActive('/student/library') ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-blue-600'}`}>
                        {t('studentLibrary', 'Student Library')}
                      </Link>
                    </>
                  )}

                  {user.role === 'STUDENT' && (
                    <>
                      <Link to="/student/papers" className={`transition-colors ${isActive('/student/papers') ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-blue-600'}`}>
                        {t('myPapers', 'My Question Papers')}
                      </Link>
                      <Link to="/student/practice" className="text-purple-700 hover:text-purple-900 font-bold bg-purple-50 px-2.5 py-1 rounded-lg">
                        {t('practiceArena', 'Practice (MHT-CET)')}
                      </Link>
                      <Link to="/student/announcements" className={`transition-colors ${isActive('/student/announcements') ? 'text-purple-900 font-bold' : 'text-purple-700 hover:text-purple-900 font-bold'}`}>
                        {t('announcements', 'Announcements')}
                      </Link>
                      <Link to="/student/library" className={`transition-colors ${isActive('/student/library') ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-blue-600'}`}>
                        {t('studentLibrary', 'Student Library')}
                      </Link>
                      <Link to="/student/results" className={`transition-colors ${isActive('/student/results') ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-blue-600'}`}>
                        {t('results', 'Results')}
                      </Link>
                      <Link to="/student/quizzes" className={`transition-colors ${isActive('/student/quizzes') ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-blue-600'}`}>
                        {t('quizzes', 'Quizzes')}
                      </Link>
                    </>
                  )}
                </div>

                {/* Minimal User Profile Avatar Button */}
                <Link
                  to={profileRoute}
                  className="w-10 h-10 rounded-full border-2 border-blue-500 p-0.5 overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center shadow-sm hover:shadow-md hover:border-blue-600 hover:scale-105 transition-all group"
                  title={`${user.name} (${user.role}) — ${t('profile', 'Profile')}`}
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <svg className="w-5 h-5 text-blue-600 fill-current" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}
                </Link>
              </div>

              {/* Mobile Hamburger Button */}
              <div className="flex md:hidden items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Toggle navigation menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {user && mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top duration-200">
          {/* User Info Header in Mobile Drawer */}
          <Link
            to={profileRoute}
            onClick={closeMenu}
            className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl"
          >
            <div className="w-10 h-10 rounded-full border-2 border-blue-500 p-0.5 overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                  {user.name ? user.name[0] : 'U'}
                </div>
              )}
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500 font-medium uppercase">{user.role} {t('profile', 'Profile')}</p>
            </div>
          </Link>

          {/* Nav Links List */}
          <div className="flex flex-col space-y-1 pt-1 text-sm font-semibold">
            {user.role === 'TEACHER' && (
              <>
                <Link to="/teacher/students" onClick={closeMenu} className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100">
                  {t('yourStudents', 'Your Students')}
                </Link>
                <Link to="/generator" onClick={closeMenu} className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100">
                  {t('generateQP', 'Generate QP')}
                </Link>
                <Link to="/teacher/results/create" onClick={closeMenu} className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100">
                  {t('results', 'Results')}
                </Link>
                <Link to="/teacher/quiz" onClick={closeMenu} className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100">
                  {t('quizzes', 'Quizzes')}
                </Link>
                <Link to="/manage/announcements" onClick={closeMenu} className="px-3 py-2 rounded-lg text-purple-700 hover:bg-purple-50">
                  {t('announcements', 'Announcements')}
                </Link>
                <Link to="/admin/knowledge-base" onClick={closeMenu} className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100">
                  {t('knowledgeBase', 'Knowledge Base')}
                </Link>
                <Link to="/student/library" onClick={closeMenu} className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100">
                  {t('studentLibrary', 'Student Library')}
                </Link>
              </>
            )}

            {user.role === 'ADMIN' && (
              <>
                <Link to="/admin/users" onClick={closeMenu} className="px-3 py-2 rounded-lg text-purple-700 hover:bg-purple-50">
                  {t('manageUsers', 'Manage Users')}
                </Link>
                <Link to="/admin/allocations" onClick={closeMenu} className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100">
                  {t('allocations', 'Allocations')}
                </Link>
                <Link to="/manage/announcements" onClick={closeMenu} className="px-3 py-2 rounded-lg text-purple-700 hover:bg-purple-50">
                  {t('announcements', 'Announcements')}
                </Link>
                <Link to="/admin/knowledge-base" onClick={closeMenu} className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100">
                  {t('knowledgeBase', 'Knowledge Base')}
                </Link>
                <Link to="/student/library" onClick={closeMenu} className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100">
                  {t('studentLibrary', 'Student Library')}
                </Link>
              </>
            )}

            {user.role === 'STUDENT' && (
              <>
                <Link to="/student/papers" onClick={closeMenu} className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100">
                  {t('myPapers', 'My Question Papers')}
                </Link>
                <Link to="/student/practice" onClick={closeMenu} className="px-3 py-2 rounded-lg text-purple-700 hover:bg-purple-50">
                  {t('practiceArena', 'Practice (MHT-CET)')}
                </Link>
                <Link to="/student/announcements" onClick={closeMenu} className="px-3 py-2 rounded-lg text-purple-700 hover:bg-purple-50">
                  {t('announcements', 'Announcements')}
                </Link>
                <Link to="/student/library" onClick={closeMenu} className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100">
                  {t('studentLibrary', 'Student Library')}
                </Link>
                <Link to="/student/results" onClick={closeMenu} className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100">
                  {t('results', 'Results')}
                </Link>
                <Link to="/student/quizzes" onClick={closeMenu} className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100">
                  {t('quizzes', 'Quizzes')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
