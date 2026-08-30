import { useEffect, useState } from 'react';

export default function ProtectedDocumentViewer({ documentId, title, documentTitle, fileUrl, driveFileId, onClose }) {
  const displayTitle = title || documentTitle || 'Study Material Document';
  const [iframeError, setIframeError] = useState(false);
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

  // Compute Google Drive official embed URL
  const getEmbedUrl = () => {
    const rootFolderId = '1lt8-tHT6wniWRLwPrsZizWmFCJQ423r3';

    if (fileUrl && fileUrl.includes('drive.google.com/file/d/')) {
      const match = fileUrl.match(/\/file\/d\/([^\/]+)/);
      if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
    }

    if (driveFileId && !driveFileId.startsWith('drive-sync-') && !driveFileId.startsWith('local-sim-')) {
      return `https://drive.google.com/file/d/${driveFileId}/preview`;
    }

    if (fileUrl && fileUrl.includes('drive.google.com/drive/folders/')) {
      const match = fileUrl.match(/\/folders\/([^\/?]+)/);
      if (match) return `https://drive.google.com/embeddedfolderview?id=${match[1]}#list`;
    }

    return `https://drive.google.com/embeddedfolderview?id=${rootFolderId}#list`;
  };

  const embedUrl = getEmbedUrl();
  const directLink = fileUrl || `https://drive.google.com/drive/folders/1lt8-tHT6wniWRLwPrsZizWmFCJQ423r3`;

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
            <span className="px-2.5 py-1 rounded bg-purple-600/30 border border-purple-400/40 text-purple-200 text-xs font-bold uppercase tracking-wide">
              Document Viewer
            </span>
            <h3 className="font-bold text-base text-slate-100 truncate max-w-xl">{displayTitle}</h3>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={directLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all shadow-sm"
            >
              Open in Drive
            </a>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all"
            >
              Close
            </button>
          </div>
        </div>

        {/* Dynamic Toast Alert (Triggers ONLY when user attempts to copy or cut) */}
        {showWarning && (
          <div className="bg-amber-600 text-white px-6 py-2.5 flex items-center justify-between text-xs font-bold shadow-md">
            <span>Text copying and cutting are disabled for institutional study materials.</span>
            <button onClick={() => setShowWarning(false)} className="text-white hover:text-amber-200 ml-4">✕</button>
          </div>
        )}

        {/* Main Document Frame */}
        <div className="relative flex-1 bg-slate-100 overflow-hidden flex flex-col items-center justify-center p-3">
          {iframeError ? (
            <div className="text-center p-8 bg-white rounded-2xl shadow-md border border-slate-200 max-w-md space-y-4">
              <h4 className="font-bold text-base text-slate-800">Google Drive Document Access</h4>
              <p className="text-xs text-slate-500">
                To view this document directly on Google Drive, click the button below.
              </p>
              <a
                href={directLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
              >
                Open Study Material in Google Drive
              </a>
            </div>
          ) : (
            <iframe
              src={embedUrl}
              title={displayTitle}
              className="w-full h-full rounded-xl border border-slate-300 shadow-inner bg-white"
              onError={() => setIframeError(true)}
              onContextMenu={(e) => e.preventDefault()}
            />
          )}
        </div>
      </div>
    </div>
  );
}
