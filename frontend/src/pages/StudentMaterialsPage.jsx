import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { TableSkeleton } from '../components/Skeleton';
import ProtectedDocumentViewer from '../components/ProtectedDocumentViewer';

const STREAMS = [
  '12th Science',
  '11th Science',
  '12th arts',
  '11th Arts',
  '12th Commerce',
  '11th Commerce'
];

const STREAM_SUBJECTS = {
  '12th Science': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  '11th Science': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  '12th arts': ['History', 'Political Science', 'Sociology', 'Economics'],
  '11th Arts': ['History', 'Political Science', 'Sociology', 'Economics'],
  '12th Commerce': ['Book-keeping & Accountancy', 'Organization of Commerce', 'Secretarial Practice', 'Economics'],
  '11th Commerce': ['Book-keeping & Accountancy', 'Organization of Commerce', 'Secretarial Practice', 'Economics']
};

const CATEGORIES = [
  { key: 'Notes', label: 'Notes' },
  { key: 'PYQP', label: 'Previous Year Question Papers (PYQP)' },
  { key: 'Question Banks', label: 'Question Banks' },
  { key: 'Textbook', label: 'Textbook' }
];

export default function StudentMaterialsPage() {
  const [selectedStream, setSelectedStream] = useState('12th Science');
  const [selectedSubject, setSelectedSubject] = useState('Physics');
  const [selectedCategory, setSelectedCategory] = useState('PYQP');
  const [activeDocument, setActiveDocument] = useState(null);

  // 1. Fetch Student Profile for Context Auto-Resolution
  const { data: profile } = useQuery({
    queryKey: ['studentEnrolledProfile'],
    queryFn: async () => {
      const res = await apiClient.get('/student-library/profile');
      return res.data.data;
    },
    onSuccess: (data) => {
      if (data?.resolvedClassName && STREAMS.includes(data.resolvedClassName)) {
        setSelectedStream(data.resolvedClassName);
      }
    }
  });

  const availableSubjects = useMemo(() => {
    return STREAM_SUBJECTS[selectedStream] || ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
  }, [selectedStream]);

  const activeSubject = availableSubjects.includes(selectedSubject) ? selectedSubject : availableSubjects[0];

  // 2. Fetch Actual Files directly from Google Drive Folder Tree
  const { data: driveResponse, isLoading: filesLoading, error } = useQuery({
    queryKey: ['googleDriveFiles', selectedStream, activeSubject, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams({
        stream: selectedStream,
        subject: activeSubject,
        category: selectedCategory
      });
      const res = await apiClient.get(`/student-library/drive-files?${params.toString()}`);
      return res.data;
    }
  });

  const driveFiles = driveResponse?.data || [];
  const folderPath = driveResponse?.folderPath || `${selectedStream} / ${activeSubject} / ${selectedCategory}`;

  const formatBytes = (bytes) => {
    if (!bytes) return 'PDF File';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (file) => {
    const downloadUrl = `/api/student-library/drive-files/${file.id}/download?fileName=${encodeURIComponent(file.name)}`;
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8 select-none">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-purple-600/30 border border-purple-400/40 text-purple-200 text-[10px] font-bold uppercase tracking-wider">
              Google Drive Library System
            </span>
            <span className="text-xs text-purple-300 font-semibold">
              Root Folder: QpGen_dataset
            </span>
          </div>
          <h1 className="text-3xl font-extrabold mt-1 text-slate-100">Student Study Library</h1>
          <p className="text-sm text-slate-300 mt-1">
            Directly retrieving authentic curriculum study materials from institutional Google Drive folders.
          </p>
        </div>
      </div>

      {/* Level 1: Stream / Class Context Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Academic Stream / Class</h2>
          {profile?.rawClassName && (
            <span className="text-xs text-purple-700 font-bold bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
              Enrolled Class Profile: {profile.rawClassName}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {STREAMS.map((st) => (
            <button
              key={st}
              onClick={() => {
                setSelectedStream(st);
                const subs = STREAM_SUBJECTS[st] || [];
                if (!subs.includes(selectedSubject)) setSelectedSubject(subs[0]);
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all border ${
                selectedStream === st
                  ? 'bg-purple-700 text-white border-purple-600 shadow-md scale-[1.02]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Breadcrumb Folder Path */}
      <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <span className="text-purple-700 font-bold">QpGen_dataset</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-800 font-bold">{selectedStream}</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-800 font-bold">{activeSubject}</span>
        <span className="text-slate-300">/</span>
        <span className="text-purple-800 font-bold uppercase">{selectedCategory}</span>
      </div>

      {/* Level 2: Stream-Scoped Subjects */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Available Subjects ({selectedStream})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {availableSubjects.map((sub) => {
            const isSelected = activeSubject === sub;
            return (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`p-4 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-purple-50 border-purple-500 text-purple-950 font-bold shadow-sm ring-1 ring-purple-400'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300'
                }`}
              >
                <div className="text-sm font-bold truncate">{sub}</div>
                <div className="text-[10px] text-slate-400 mt-1">Google Drive Folder</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Level 3: Material Category Tabs */}
      <div className="card space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`btn-sm font-bold transition-all ${
                  selectedCategory === cat.key ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500 font-bold">
            Total Files in Drive: {driveFiles.length}
          </div>
        </div>

        {filesLoading && <TableSkeleton rows={4} columns={3} />}
        {error && (
          <div className="rounded-xl bg-red-50 p-4 border border-red-200 text-red-700 text-sm">
            Unable to fetch Google Drive files. Please ensure Google Drive API connection is active.
          </div>
        )}

        {!filesLoading && !error && driveFiles.length === 0 && (
          <div className="text-center py-12 space-y-2 bg-slate-50/60 rounded-xl border border-dashed border-slate-300">
            <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto text-xl font-bold">
              📂
            </div>
            <p className="text-base font-bold text-slate-700">
              No study material available in this Google Drive folder.
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-mono">
              Folder Path: {folderPath}
            </p>
          </div>
        )}

        {!filesLoading && !error && driveFiles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {driveFiles.map((file) => (
              <div
                key={file.id}
                className="p-5 rounded-xl border border-slate-200 hover:border-purple-400 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[10px] font-bold uppercase tracking-wider">
                      Google Drive File
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatBytes(file.fileSize)}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 line-clamp-2 break-all">{file.name}</h3>

                  <div className="pt-2 text-xs text-slate-500 space-y-1 border-t border-slate-100 font-mono">
                    <div><strong>Folder:</strong> {selectedCategory}</div>
                    <div><strong>Subject:</strong> {activeSubject}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setActiveDocument(file)}
                    className="flex-1 btn-primary py-2 text-xs font-bold"
                  >
                    View Document
                  </button>
                  <button
                    onClick={() => handleDownload(file)}
                    className="px-3 py-2 btn-secondary text-xs font-bold border border-slate-300 hover:bg-slate-100"
                    title="Download File"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document Viewer Modal */}
      {activeDocument && (
        <ProtectedDocumentViewer
          documentId={activeDocument.id}
          title={activeDocument.name}
          subjectName={activeSubject}
          className={selectedStream}
          onClose={() => setActiveDocument(null)}
        />
      )}
    </div>
  );
}