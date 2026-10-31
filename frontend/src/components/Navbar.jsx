import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const getDashboardRoute = () => {
    if (!user) return '/';
    if (user.role === 'TEACHER') return '/dashboard';
    if (user.role === 'ADMIN' || user.role === 'DEVELOPER') return '/admin/dashboard';
    if (user.role === 'STUDENT') return '/student/papers';
    return '/';
  };

  const getProfileRoute = () => {
    if (!user) return '/';
    if (user.role === 'TEACHER') return '/teacher/profile';
    if (user.role === 'STUDENT') return '/student/profile';
    if (user.role === 'ADMIN' || user.role === 'DEVELOPER') return '/admin/profile';
    return '/';
  };

  const dashboardRoute = getDashboardRoute();
  const profileRoute = getProfileRoute();

  const closeMenu = () => setMobileMenuOpen(false);
  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
      isActive(path)
        ? 'bg-slate-900 text-white'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  const mobileNavLinkClass = (path) =>
    `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive(path)
        ? 'bg-slate-900 text-white font-semibold'
        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
    }`;

  const isAdminOrDev = user?.role === 'ADMIN' || user?.role === 'DEVELOPER';

  return (
    <nav className="border-b border-slate-200/90 bg-white/95 backdrop-blur-sm sticky top-0 z-40 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          {/* Brand Logo */}
          <Link
            to={dashboardRoute}
            onClick={closeMenu}
            className="flex items-center gap-2.5 text-slate-900 hover:text-slate-700 transition-colors"
            title="QPGen Dashboard"
          >
            <img src="/logo.svg" alt="QPGen Logo" className="w-7 h-7 rounded-md object-contain" />
            <span className="font-bold text-base tracking-tight">{t('brandName', 'QPGen')}</span>
          </Link>

          {user && (
            <>
              {/* Desktop Navigation Links */}
              <div className="hidden lg:flex items-center gap-1.5">
                {user.role === 'TEACHER' && (
                  <>
                    <Link to="/teacher/students" className={navLinkClass('/teacher/students')}>
                      {t('yourStudents', 'Students')}
                    </Link>
                    <Link to="/generator" className={navLinkClass('/generator')}>
                      {t('generateQP', 'Generate QP')}
                    </Link>
                    <Link to="/teacher/results/create" className={navLinkClass('/teacher/results/create')}>
                      {t('results', 'Results')}
                    </Link>
                    <Link to="/teacher/quiz" className={navLinkClass('/teacher/quiz')}>
                      {t('quizzes', 'Quizzes')}
                    </Link>
                    <Link to="/manage/announcements" className={navLinkClass('/manage/announcements')}>
                      {t('announcements', 'Announcements')}
                    </Link>
                    <Link to="/admin/knowledge-base" className={navLinkClass('/admin/knowledge-base')}>
                      {t('knowledgeBase', 'Knowledge Base')}
                    </Link>
                    <Link to="/student/library" className={navLinkClass('/student/library')}>
                      {t('studentLibrary', 'Library')}
                    </Link>
                  </>
                )}

                {isAdminOrDev && (
                  <>
                    <Link to="/admin/dashboard" className={navLinkClass('/admin/dashboard')}>
                      Dashboard
                    </Link>
                    <Link to="/admin/users" className={navLinkClass('/admin/users')}>
                      {t('manageUsers', 'Users')}
                    </Link>
                    <Link to="/admin/allocations" className={navLinkClass('/admin/allocations')}>
                      {t('allocations', 'Allocations')}
                    </Link>
                    <Link to="/manage/announcements" className={navLinkClass('/manage/announcements')}>
                      {t('announcements', 'Announcements')}
                    </Link>
                    <Link to="/admin/knowledge-base" className={navLinkClass('/admin/knowledge-base')}>
                      {t('knowledgeBase', 'Knowledge Base')}
                    </Link>
                    <Link to="/student/library" className={navLinkClass('/student/library')}>
                      {t('studentLibrary', 'Library')}
                    </Link>
                  </>
                )}

                {user.role === 'STUDENT' && (
                  <>
                    <Link to="/student/papers" className={navLinkClass('/student/papers')}>
                      {t('myPapers', 'Question Papers')}
                    </Link>
                    <Link to="/student/practice" className={navLinkClass('/student/practice')}>
                      {t('practiceArena', 'Practice (MHT-CET)')}
                    </Link>
                    <Link to="/student/announcements" className={navLinkClass('/student/announcements')}>
                      {t('announcements', 'Announcements')}
                    </Link>
                    <Link to="/student/library" className={navLinkClass('/student/library')}>
                      {t('studentLibrary', 'Library')}
                    </Link>
                    <Link to="/student/results" className={navLinkClass('/student/results')}>
                      {t('results', 'Results')}
                    </Link>
                    <Link to="/student/quizzes" className={navLinkClass('/student/quizzes')}>
                      {t('quizzes', 'Quizzes')}
                    </Link>
                  </>
                )}
              </div>

              {/* User Profile Avatar & Role Badge */}
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  to={profileRoute}
                  className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  title={`${user.name} (${user.role}) — ${t('profile', 'Profile')}`}
                >
                  <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center text-slate-700 font-semibold text-xs shrink-0">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                    )}
                  </div>
                  <div className="text-left text-xs leading-tight">
                    <p className="font-semibold text-slate-900 truncate max-w-[120px]">{user.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{user.role}</p>
                  </div>
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <div className="flex lg:hidden items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
                  aria-label="Toggle navigation menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top duration-200">
          <Link
            to={profileRoute}
            onClick={closeMenu}
            className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl mb-3"
          >
            <div className="w-9 h-9 rounded-full border border-slate-200 overflow-hidden bg-white flex items-center justify-center text-slate-700 font-semibold text-xs shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
              )}
            </div>
            <div>
              <p className="font-semibold text-sm text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{user.role} {t('profile', 'Profile')}</p>
            </div>
          </Link>

          <div className="flex flex-col space-y-1">
            {user.role === 'TEACHER' && (
              <>
                <Link to="/teacher/students" onClick={closeMenu} className={mobileNavLinkClass('/teacher/students')}>
                  {t('yourStudents', 'Students')}
                </Link>
                <Link to="/generator" onClick={closeMenu} className={mobileNavLinkClass('/generator')}>
                  {t('generateQP', 'Generate QP')}
                </Link>
                <Link to="/teacher/results/create" onClick={closeMenu} className={mobileNavLinkClass('/teacher/results/create')}>
                  {t('results', 'Results')}
                </Link>
                <Link to="/teacher/quiz" onClick={closeMenu} className={mobileNavLinkClass('/teacher/quiz')}>
                  {t('quizzes', 'Quizzes')}
                </Link>
                <Link to="/manage/announcements" onClick={closeMenu} className={mobileNavLinkClass('/manage/announcements')}>
                  {t('announcements', 'Announcements')}
                </Link>
                <Link to="/admin/knowledge-base" onClick={closeMenu} className={mobileNavLinkClass('/admin/knowledge-base')}>
                  {t('knowledgeBase', 'Knowledge Base')}
                </Link>
                <Link to="/student/library" onClick={closeMenu} className={mobileNavLinkClass('/student/library')}>
                  {t('studentLibrary', 'Library')}
                </Link>
              </>
            )}

            {isAdminOrDev && (
              <>
                <Link to="/admin/dashboard" onClick={closeMenu} className={mobileNavLinkClass('/admin/dashboard')}>
                  Dashboard
                </Link>
                <Link to="/admin/users" onClick={closeMenu} className={mobileNavLinkClass('/admin/users')}>
                  {t('manageUsers', 'Users')}
                </Link>
                <Link to="/admin/allocations" onClick={closeMenu} className={mobileNavLinkClass('/admin/allocations')}>
                  {t('allocations', 'Allocations')}
                </Link>
                <Link to="/manage/announcements" onClick={closeMenu} className={mobileNavLinkClass('/manage/announcements')}>
                  {t('announcements', 'Announcements')}
                </Link>
                <Link to="/admin/knowledge-base" onClick={closeMenu} className={mobileNavLinkClass('/admin/knowledge-base')}>
                  {t('knowledgeBase', 'Knowledge Base')}
                </Link>
                <Link to="/student/library" onClick={closeMenu} className={mobileNavLinkClass('/student/library')}>
                  {t('studentLibrary', 'Library')}
                </Link>
              </>
            )}

            {user.role === 'STUDENT' && (
              <>
                <Link to="/student/papers" onClick={closeMenu} className={mobileNavLinkClass('/student/papers')}>
                  {t('myPapers', 'Question Papers')}
                </Link>
                <Link to="/student/practice" onClick={closeMenu} className={mobileNavLinkClass('/student/practice')}>
                  {t('practiceArena', 'Practice (MHT-CET)')}
                </Link>
                <Link to="/student/announcements" onClick={closeMenu} className={mobileNavLinkClass('/student/announcements')}>
                  {t('announcements', 'Announcements')}
                </Link>
                <Link to="/student/library" onClick={closeMenu} className={mobileNavLinkClass('/student/library')}>
                  {t('studentLibrary', 'Library')}
                </Link>
                <Link to="/student/results" onClick={closeMenu} className={mobileNavLinkClass('/student/results')}>
                  {t('results', 'Results')}
                </Link>
                <Link to="/student/quizzes" onClick={closeMenu} className={mobileNavLinkClass('/student/quizzes')}>
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
