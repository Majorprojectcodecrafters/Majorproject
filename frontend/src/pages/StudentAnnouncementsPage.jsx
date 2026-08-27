import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';

export default function StudentAnnouncementsPage() {
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);

  const { data: announcements = [], isLoading, error } = useQuery({
    queryKey: ['studentAnnouncements'],
    queryFn: async () => {
      const res = await apiClient.get('/announcements');
      return res.data.data || [];
    }
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Notice & Announcements</h1>
        <p className="mt-1 text-sm text-gray-600">
          Official institutional and teacher announcements, circulars, and notices.
        </p>
      </div>

      {isLoading && <p className="py-8 text-center text-gray-500">Loading notices...</p>}
      {error && <p className="rounded bg-red-50 p-4 text-red-700">Unable to load announcements.</p>}

      {!isLoading && !error && announcements.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No active announcements for your class right now.
        </div>
      )}

      {!isLoading && !error && announcements.length > 0 && (
        <div className="space-y-6">
          {announcements.map((a) => (
            <div key={a.id} className="card space-y-4 border-l-4 border-blue-600">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                <div className="flex items-center gap-2">
                  <span className="badge badge-info">{a.authorRole}</span>
                  <span className="text-xs text-gray-500">By <strong>{a.authorName}</strong></span>
                  {a.class ? (
                    <span className="badge bg-purple-100 text-purple-900 font-bold text-[10px]">
                      Class: {a.class.name}
                    </span>
                  ) : (
                    <span className="badge bg-green-100 text-green-900 font-bold text-[10px]">
                      BROADCAST TO ALL
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-400 font-mono">
                  {new Date(a.createdAt).toLocaleDateString()} {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900">{a.title}</h2>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {a.content}
              </div>

              {/* Attachment Card */}
              {a.attachmentUrl && (
                <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-3 bg-gray-50/80 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                    <span>📎 Attachment ({a.attachmentType}):</span>
                  </div>

                  <div className="flex gap-2">
                    {a.attachmentType === 'IMAGE' && (
                      <button
                        onClick={() => setSelectedImageUrl(a.attachmentUrl)}
                        className="btn-secondary py-1 text-xs bg-white text-blue-700"
                      >
                        🖼️ Preview Image Notice
                      </button>
                    )}

                    {a.attachmentType === 'PDF' && (
                      <button
                        onClick={() => setSelectedPdfUrl(a.attachmentUrl)}
                        className="btn-secondary py-1 text-xs bg-white text-red-700"
                      >
                        📄 Open PDF Notice Viewer
                      </button>
                    )}

                    <a
                      href={a.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary py-1 text-xs"
                    >
                      🔗 Open Direct Link
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* PDF Document Viewer Modal */}
      {selectedPdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col p-4">
            <div className="flex justify-between items-center border-b pb-2 mb-3">
              <h3 className="font-bold text-gray-900 text-lg">📄 Notice PDF Viewer</h3>
              <button
                onClick={() => setSelectedPdfUrl(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>
            <iframe
              src={selectedPdfUrl}
              title="PDF Notice Attachment"
              className="w-full flex-grow border rounded-md"
            />
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full p-4 space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-gray-900 text-lg">🖼️ Notice Image</h3>
              <button
                onClick={() => setSelectedImageUrl(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex justify-center">
              <img src={selectedImageUrl} alt="Notice attachment" className="max-w-full h-auto rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
