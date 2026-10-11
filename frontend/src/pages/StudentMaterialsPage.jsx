import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function StudentMaterialsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const getDashboardRoute = () => {
    if (!user) return '/';
    if (user.role === 'TEACHER') return '/dashboard';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    if (user.role === 'STUDENT') return '/student/papers';
    return '/';
  };

  const upcomingFeatures = [
    {
      title: t('cloudSyncTitle', 'Direct Google Drive Repository'),
      desc: t('cloudSyncDesc', 'Automated cloud folder hierarchy organized by Academic Year, Class, Stream, Subject, and Material Category.'),
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      )
    },
    {
      title: t('secureViewerTitle', 'Protected In-App Document Reader'),
      desc: t('secureViewerDesc', 'High-speed encrypted PDF document streaming with watermarking, zero URL disclosure, and instant chapter search.'),
      icon: (
        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      title: t('curriculumLinkageTitle', 'MSBSHSE Curriculum Alignment'),
      desc: t('curriculumLinkageDesc', 'Full catalog of official Balbharti State Board textbooks, chapter notes, and past HSC board papers.'),
      icon: (
        <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      title: t('ragIntegrationTitle', 'AI Grounded Study Assistant'),
      desc: t('ragIntegrationDesc', 'Integrated with QPGen RAG Retrieval Engine so teachers can generate contextual questions directly from uploaded notes.'),
      icon: (
        <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 select-none">
      <div className="max-w-4xl w-full space-y-8 text-center">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider shadow-sm">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span>{t('featureComingSoonBadge', 'Feature Under Development • Version 2.1 Release')}</span>
        </div>

        {/* Hero Section */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            {t('studentLibraryTitle', 'Digital Student Library & Resource Hub')}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t(
              'studentLibraryComingSoonDesc',
              'We are currently preparing our high-speed cloud repository and secure document reader. Soon, students and faculty will be able to browse verified textbooks, notes, and past examination papers directly inside the portal.'
            )}
          </p>
        </div>

        {/* Interactive Feature Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left pt-4">
          {upcomingFeatures.map((feat, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow space-y-3"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                {feat.icon}
              </div>
              <h3 className="text-base font-bold text-slate-900">{feat.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">{feat.desc}</p>
            </div>
          ))}
        </div>

        {/* Notice Card */}
        <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 font-medium flex items-center justify-between flex-wrap gap-4 text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
              ℹ️
            </div>
            <div>
              <p className="font-bold text-blue-950">
                {t('noticeHeading', 'Institutional Notice')}
              </p>
              <p className="text-blue-800">
                {t('noticeBody', 'Question Paper Generation, Online Examination Arena, and Results Management remain 100% active and operational.')}
              </p>
            </div>
          </div>
          <Link
            to={getDashboardRoute()}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>{t('backToDashboard', 'Return to Dashboard')}</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}