import { useEffect } from 'react';

export default function ProtectedDocumentViewer({ documentId, title, documentTitle, fileUrl, onClose }) {
  const displayTitle = title || documentTitle || 'Study Material Document';

  // Enforce copy, cut, paste, and right-click context menu disabled
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'C', 'x', 'X', 'v', 'V', 'a', 'A'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        alert('✂️ Copying, cutting, and pasting are disabled for study materials.');
        return false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  const driveEmbedUrl = fileUrl || `https://drive.google.com/drive/folders/1lt8-tHT6wniWRLwPrsZizWmFCJQ423r3`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 select-none"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
    >
      <div className="relative w-full max-w-5xl h-[88vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-purple-600/30 border border-purple-400/40 text-purple-200 text-xs font-bold uppercase">
              📄 Document Viewer
            </span>
            <h3 className="font-bold text-base text-slate-100 truncate max-w-xl">{displayTitle}</h3>
          </div>

          <div className="flex items-center gap-3">
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>🔗</span> Open in Drive
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Notice Bar: Copy & Cut Disabled */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between text-xs text-amber-800 font-medium">
          <div className="flex items-center gap-2">
            <span>🛡️</span>
            <span><strong>Access Control:</strong> Text copying and cutting are disabled for institutional study materials.</span>
          </div>
        </div>

        {/* Main Document Frame */}
        <div className="relative flex-1 bg-slate-100 overflow-hidden flex items-center justify-center p-2">
          <iframe
            src={driveEmbedUrl}
            title={displayTitle}
            className="w-full h-full rounded-xl border border-slate-300 shadow-inner bg-white"
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      </div>
    </div>
  );
}
