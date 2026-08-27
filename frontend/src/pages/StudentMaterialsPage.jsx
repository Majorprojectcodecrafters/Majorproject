import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { TableSkeleton } from '../components/Skeleton';
import ProtectedDocumentViewer from '../components/ProtectedDocumentViewer';

export default function StudentMaterialsPage() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeDocument, setActiveDocument] = useState(null);

  // Fetch student study materials
  const { data: materials = [], isLoading, error } = useQuery({
    queryKey: ['studentStudyMaterials', typeFilter],
    queryFn: async () => {
      const res = await apiClient.get(`/student-library/materials?category=${typeFilter}`);
      return res.data.data || [];
    }
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header Banner */}
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-purple-950 text-white p-6 rounded-2xl shadow-lg border border-purple-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-info bg-purple-800 text-purple-200 border-purple-600 font-bold text-xs">
              SECURE DRIVE STORAGE
            </span>
            <span className="text-xs text-purple-300">Protected Library</span>
          </div>
          <h1 className="text-3xl font-bold mt-1">Study Materials & Notes</h1>
          <p className="text-sm text-purple-300 mt-1">
            Textbooks, teacher notes, and MHT-CET reference materials uploaded by your institution.
          </p>
        </div>

        <div className="bg-purple-900/80 p-3 rounded-xl border border-purple-700/60 text-xs text-purple-200 space-y-1">
          <div className="font-bold text-amber-300">🔒 Security Notice:</div>
          <p>Documents are protected with dynamic watermarks. Downloads & screenshots are disabled.</p>
        </div>
      </div>

      {/* Material Filter & List */}
      <div className="card space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          <div className="flex flex-wrap gap-2">
            {[
              ['all', '📚 All Materials'],
              ['TEXTBOOK', '📖 Textbooks'],
              ['TEACHER_NOTES', '📝 Teacher Notes'],
              ['CHAPTER_NOTES', '📄 Chapter Notes'],
              ['PREVIOUS_BOARD_PAPER', '🏛️ Past Papers']
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTypeFilter(value)}
                className={`btn-sm font-bold transition-all ${typeFilter === value ? 'btn-primary' : 'btn-secondary'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-500 font-bold">
            Total Available: {materials.length} Documents
          </div>
        </div>

        {isLoading && <TableSkeleton rows={5} columns={4} />}
        {error && (
          <div className="rounded-xl bg-red-50 p-4 border border-red-200 text-red-700 text-sm">
            Unable to load study materials. Please ensure backend is running.
          </div>
        )}

        {!isLoading && !error && materials.length === 0 && (
          <div className="text-center py-12 space-y-3 bg-gray-50/50 rounded-xl border border-dashed border-gray-300">
            <span className="text-4xl">📂</span>
            <p className="text-base font-bold text-gray-700">No study materials available</p>
            <p className="text-xs text-gray-500">Your teachers haven't uploaded notes for this category yet.</p>
          </div>
        )}

        {!isLoading && !error && materials.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-xl border border-gray-200 hover:border-purple-400 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 text-[10px] font-bold uppercase tracking-wider">
                      {item.sourceType || 'STUDY_MATERIAL'}
                    </span>
                    {item.driveFileId && (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        ☁️ Google Drive
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-gray-900 line-clamp-2">{item.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{item.description || 'Standard curriculum reference material.'}</p>

                  <div className="pt-2 text-xs text-gray-600 space-y-1 border-t border-gray-100">
                    <div><strong>Subject:</strong> {item.subject?.name || 'General'}</div>
                    {item.chapter && <div><strong>Chapter:</strong> {item.chapter.name}</div>}
                  </div>
                </div>

                <button
                  onClick={() => setActiveDocument(item)}
                  className="w-full btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                >
                  👁️ View Notes (Protected)
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Protected Document Viewer Modal */}
      {activeDocument && (
        <ProtectedDocumentViewer
          documentId={activeDocument.id}
          title={`${activeDocument.title} (${activeDocument.subject?.name || 'Subject'})`}
          onClose={() => setActiveDocument(null)}
        />
      )}
    </div>
  );
}