import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';
import ProtectedDocumentViewer from '../components/ProtectedDocumentViewer';

export default function StudentMaterialsPage() {
  const [viewingDocument, setViewingDocument] = useState(null);

  const { data: profile } = useQuery({
    queryKey: ['student-profile-materials'],
    queryFn: async () => {
      const res = await apiClient.get('/student-library/profile');
      return res.data?.data;
    }
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8 select-none">
      {/* Clean Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-purple-600/30 border border-purple-400/40 text-purple-200 text-[10px] font-bold uppercase tracking-wider">
              Institutional Library
            </span>
            {profile?.rawClassName && (
              <span className="text-xs text-purple-300 font-semibold">
                Enrolled: {profile.rawClassName}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold mt-1 text-slate-100">Student Study Material Library</h1>
          <p className="text-sm text-slate-300 mt-1">
            Access official curriculum textbooks, chapter notes, and previous year board papers.
          </p>
        </div>
        <div>
          <span className="px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            Syncing & Upgrading
          </span>
        </div>
      </div>

      {/* Coming Soon Showcase Card */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl text-center max-w-3xl mx-auto space-y-6">
        <div className="w-20 h-20 bg-purple-50 text-purple-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-purple-100">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-widest">
            Coming Soon
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Student Library Upgrade in Progress
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            We are currently upgrading our cloud storage integration to deliver seamless, high-speed document streaming directly from our Google Drive repository for all 11th and 12th curriculum materials.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-4 border-t border-slate-100 max-w-xl mx-auto">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div>
              <h4 className="font-bold text-xs text-slate-900">Curriculum Textbooks</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">MSB official 11th & 12th textbooks for Physics, Chemistry, Maths & Bio</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div>
              <h4 className="font-bold text-xs text-slate-900">Chapter Notes & PYQP</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Detailed notes, formula sheets, and past board papers (2020-2025)</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div>
              <h4 className="font-bold text-xs text-slate-900">Direct In-App Viewer</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">High-speed private PDF streaming with protected inline document viewer</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div>
              <h4 className="font-bold text-xs text-slate-900">Server Authentication</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Zero external browser redirects or personal Google login requirements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Document Viewer */}
      {viewingDocument && (
        <ProtectedDocumentViewer
          documentId={viewingDocument.id}
          title={viewingDocument.name || viewingDocument.title}
          onClose={() => setViewingDocument(null)}
        />
      )}
    </div>
  );
}