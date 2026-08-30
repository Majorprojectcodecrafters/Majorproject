import { useEffect, useState } from 'react';

export default function ProtectedDocumentViewer({ documentId, title, documentTitle, subjectName, className, onClose }) {
  const displayTitle = title || documentTitle || 'Study Material Document';
  const [showWarning, setShowWarning] = useState(false);

  const triggerCopyCutWarning = () => {
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 3500);
  };

  // Intercept Copy/Cut keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'C', 'x', 'X', 'v', 'V'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        triggerCopyCutWarning();
        return false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  // Direct backend Google Drive stream endpoint (NO EXTERNAL REDIRECTS)
  const streamUrl = `/api/student-library/materials/${documentId}/view#toolbar=0&navpanes=0&scrollbar=1`;
  const downloadUrl = `/api/student-library/materials/${documentId}/download?fileName=${encodeURIComponent(displayTitle)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 select-none"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => { e.preventDefault(); triggerCopyCutWarning(); }}
      onCut={(e) => { e.preventDefault(); triggerCopyCutWarning(); }}
      onPaste={(e) => { e.preventDefault(); triggerCopyCutWarning(); }}
    >
      <div className="relative w-full max-w-5xl h-[88vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-emerald-600/30 border border-emerald-400/40 text-emerald-200 text-xs font-bold uppercase tracking-wide">
              Google Drive Viewer
            </span>
            <h3 className="font-bold text-base text-slate-100 truncate max-w-lg">{displayTitle}</h3>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs transition-all flex items-center gap-1.5"
            >
              Download
            </a>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all"
            >
              Close
            </button>
          </div>
        </div>

        {/* Dynamic Toast Alert */}
        {showWarning && (
          <div className="bg-amber-600 text-white px-6 py-2.5 flex items-center justify-between text-xs font-bold shadow-md">
            <span>Text copying and cutting are disabled for institutional study materials.</span>
            <button onClick={() => setShowWarning(false)} className="text-white hover:text-amber-200 ml-4">✕</button>
          </div>
        )}

        {/* Main Document Body — Embedded Backend Stream Iframe */}
        <div className="relative flex-1 bg-slate-100 overflow-hidden flex flex-col items-center justify-center p-3">
          <iframe
            src={streamUrl}
            title={displayTitle}
            className="w-full h-full rounded-xl border border-slate-300 shadow-inner bg-white"
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      </div>
    </div>
  );
}
