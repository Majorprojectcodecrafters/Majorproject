import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { TableSkeleton } from '../components/Skeleton';
import ProtectedDocumentViewer from '../components/ProtectedDocumentViewer';

export default function StudentMaterialsPage() {
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeDocument, setActiveDocument] = useState(null);
  const [viewMode, setViewMode] = useState('folder'); // 'folder' | 'grid'

  // 1. Automatically fetch Enrolled Student Profile & Auto-Class Resolution
  const { data: profileData } = useQuery({
    queryKey: ['studentEnrolledProfile'],
    queryFn: async () => {
      const res = await apiClient.get('/student-library/profile');
      return res.data.data;
    }
  });

  const enrolledClassId = profileData?.classId || '';
  const enrolledClassName = profileData?.rawClassName || 'Enrolled Class';
  const resolvedClassName = profileData?.resolvedClassName || '12th Science';
  const studentStream = profileData?.stream || 'Science';

  // 2. Fetch Stream-Scoped Subjects for Enrolled Class ONLY (Auto-Cascaded)
  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['curriculumSubjectsByClass', enrolledClassId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (enrolledClassId) params.append('classId', enrolledClassId);
      const res = await apiClient.get(`/curriculum/subjects?${params.toString()}`);
      return res.data.data || [];
    }
  });

  // 3. Fetch Enrolled Class Study Materials ONLY
  const { data: materials = [], isLoading: materialsLoading, error } = useQuery({
    queryKey: ['studentStudyMaterials', enrolledClassId, selectedSubjectId, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (enrolledClassId) params.append('classId', enrolledClassId);
      if (selectedSubjectId) params.append('subjectId', selectedSubjectId);
      if (typeFilter && typeFilter !== 'all') params.append('category', typeFilter);

      const res = await apiClient.get(`/student-library/materials?${params.toString()}`);
      return res.data.data || [];
    }
  });

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-purple-600/30 border border-purple-400/40 text-purple-200 text-[10px] font-bold uppercase tracking-wider">
              Enrolled Class Profile
            </span>
            <span className="text-xs text-purple-300 font-semibold">
              {enrolledClassName} ({studentStream} Stream)
            </span>
          </div>
          <h1 className="text-3xl font-extrabold mt-1 text-slate-100">Student Study Library</h1>
          <p className="text-sm text-slate-300 mt-1">
            Official study materials automatically synchronized for your enrolled class {resolvedClassName}.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setViewMode('folder')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'folder' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Folder Explorer
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'grid' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Grid View
          </button>
        </div>
      </div>

      {/* Breadcrumb Path Bar */}
      <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <button
          onClick={() => {
            setSelectedSubjectId('');
            setTypeFilter('all');
          }}
          className="hover:text-purple-700 font-bold"
        >
          {resolvedClassName}
        </button>

        {selectedSubject && (
          <>
            <span className="text-slate-300">/</span>
            <button onClick={() => setTypeFilter('all')} className="hover:text-purple-700 font-bold">
              {selectedSubject.name}
            </button>
          </>
        )}

        {typeFilter !== 'all' && (
          <>
            <span className="text-slate-300">/</span>
            <span className="text-purple-700 font-bold uppercase">{typeFilter.replace('_', ' ')}</span>
          </>
        )}
      </div>

      {/* Stream-Scoped Subjects for Enrolled Class ONLY */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Subjects for {resolvedClassName}
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            Showing only subjects belonging to your stream
          </span>
        </div>

        {subjectsLoading ? (
          <TableSkeleton rows={2} columns={4} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <button
              onClick={() => setSelectedSubjectId('')}
              className={`p-3.5 rounded-xl text-left border transition-all ${
                selectedSubjectId === ''
                  ? 'bg-purple-50 border-purple-400 text-purple-900 font-bold shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300'
              }`}
            >
              <div className="text-xs font-bold truncate">All Subjects</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{subjects.length} Subjects</div>
            </button>

            {subjects.map((sub) => {
              const isSelected = selectedSubjectId === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubjectId(sub.id)}
                  className={`p-3.5 rounded-xl text-left border transition-all ${
                    isSelected
                      ? 'bg-purple-50 border-purple-500 text-purple-950 font-bold shadow-sm ring-1 ring-purple-400'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{sub.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Enrolled Subject</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Study Material Category Tabs */}
      <div className="card space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          <div className="flex flex-wrap gap-2">
            {[
              ['all', 'All Materials'],
              ['TEXTBOOK', 'Textbooks'],
              ['TEACHER_NOTES', 'Notes'],
              ['PREVIOUS_BOARD_PAPER', 'Previous Year Board Papers'],
              ['REFERENCE_MATERIAL', 'Question Banks & Reference']
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTypeFilter(value)}
                className={`btn-sm font-bold transition-all ${
                  typeFilter === value ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500 font-bold">
            Total Available: {materials.length} Documents
          </div>
        </div>

        {materialsLoading && <TableSkeleton rows={4} columns={3} />}
        {error && (
          <div className="rounded-xl bg-red-50 p-4 border border-red-200 text-red-700 text-sm">
            Unable to load study materials. Please ensure backend is running.
          </div>
        )}

        {!materialsLoading && !error && materials.length === 0 && (
          <div className="text-center py-12 space-y-2 bg-slate-50/60 rounded-xl border border-dashed border-slate-300">
            <p className="text-base font-bold text-slate-700">No study materials in this folder</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No documents match the selected subject or category parameters for your enrolled class.
            </p>
          </div>
        )}

        {/* View Mode 1: Interactive Folder Explorer */}
        {viewMode === 'folder' && !materialsLoading && !error && materials.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-xl border border-slate-200 hover:border-purple-400 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 text-[10px] font-bold uppercase tracking-wider">
                        {item.category || item.sourceType}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.fileName?.endsWith('.pdf') ? 'PDF Document' : 'Document'}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 line-clamp-2">{item.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {item.description || 'Standard institutional study material.'}
                    </p>

                    <div className="pt-2 text-xs text-slate-600 space-y-1 border-t border-slate-100">
                      <div><strong>Enrolled Class:</strong> {resolvedClassName}</div>
                      <div><strong>Subject:</strong> {item.subject?.name || 'General'}</div>
                      {item.chapter && <div><strong>Chapter:</strong> {item.chapter.name}</div>}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveDocument(item)}
                    className="w-full btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    View Document
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Mode 2: Flat Grid View */}
        {viewMode === 'grid' && !materialsLoading && !error && materials.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-xl border border-slate-200 hover:border-purple-400 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 text-[10px] font-bold uppercase">
                    {item.category}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 line-clamp-2">{item.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                  <div className="text-xs text-slate-600 pt-2 border-t">
                    <strong>Subject:</strong> {item.subject?.name || 'General'}
                  </div>
                </div>

                <button
                  onClick={() => setActiveDocument(item)}
                  className="w-full btn-primary py-2.5 text-xs font-bold"
                >
                  View Document
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document Viewer Modal */}
      {activeDocument && (
        <ProtectedDocumentViewer
          documentId={activeDocument.id}
          title={`${activeDocument.title} (${activeDocument.subject?.name || 'Subject'})`}
          subjectName={activeDocument.subject?.name}
          className={resolvedClassName}
          fileUrl={activeDocument.fileUrl}
          driveFileId={activeDocument.driveFileId}
          onClose={() => setActiveDocument(null)}
        />
      )}
    </div>
  );
}