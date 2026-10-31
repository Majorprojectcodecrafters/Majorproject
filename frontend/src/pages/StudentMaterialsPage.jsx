import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function StudentMaterialsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const getDashboardRoute = () => {
    if (!user) return '/';
    if (user.role === 'TEACHER') return '/dashboard';
    if (user.role === 'ADMIN' || user.role === 'DEVELOPER') return '/admin/dashboard';
    if (user.role === 'STUDENT') return '/student/papers';
    return '/';
  };

  const upcomingFeatures = [
    {
      title: t('cloudSyncTitle', 'Google Drive Academic Repository'),
      desc: t('cloudSyncDesc', 'Automated cloud folder hierarchy organized by Academic Year, Class, Stream, Subject, and Material Category.'),
      icon: (
        <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      )
    },
    {
      title: t('secureViewerTitle', 'In-App Document Reader'),
      desc: t('secureViewerDesc', 'High-speed protected PDF document streaming with watermarking, zero direct URL exposure, and instant search.'),
      icon: (
        <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      title: t('curriculumLinkageTitle', 'MSBSHSE Curriculum Alignment'),
      desc: t('curriculumLinkageDesc', 'Full catalog of official Balbharti State Board textbooks, chapter notes, and past HSC board papers.'),
      icon: (
        <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      title: t('ragIntegrationTitle', 'AI Grounded Study Assistant'),
      desc: t('ragIntegrationDesc', 'Integrated with QPGen RAG Retrieval Engine so teachers can generate contextual questions directly from uploaded notes.'),
      icon: (
        <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 select-none">
      <div className="max-w-3xl w-full space-y-7 text-center">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          <span>{t('featureComingSoonBadge', 'Resource Library &bull; Version 2.1 Release')}</span>
        </div>

        {/* Hero Section */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t('studentLibraryTitle', 'Student Library & Resource Hub')}
          </h1>
          <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            {t(
              'studentLibraryComingSoonDesc',
              'We are currently preparing our cloud repository and secure document reader. Verified textbooks, notes, and past examination papers will be available here.'
            )}
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left pt-2">
          {upcomingFeatures.map((feat, index) => (
            <div
              key={index}
              className="card space-y-2.5 p-5"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                {feat.icon}
              </div>
              <h3 className="text-sm font-semibold text-slate-900">{feat.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>

        {/* Notice Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between flex-wrap gap-4 text-left">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-slate-900">
                {t('noticeHeading', 'Institutional Operations Active')}
              </p>
              <p className="text-slate-500 text-[11px]">
                {t('noticeBody', 'Question Paper Generation, Online Examination Arena, and Results Management remain fully active.')}
              </p>
            </div>
          </div>
          <Link
            to={getDashboardRoute()}
            className="btn-primary btn-sm"
          >
            {t('backToDashboard', 'Return to Dashboard')}
          </Link>
        </div>
      </div>
    </div>
  );
}
