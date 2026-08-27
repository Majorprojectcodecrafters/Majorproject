import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedDocumentViewer({ documentId, title, onClose }) {
  const { user } = useAuth();
  const [blurActive, setBlurActive] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userName = user?.name || 'Student';
  const userUniqueId = user?.student?.uniqueId || user?.email || 'QPGen-User';
  const timestamp = new Date().toLocaleDateString();
  const watermarkText = `CONFIDENTIAL • ${userName.toUpperCase()} (${userUniqueId}) • QPGEN PROTECTED MATERIAL • ${timestamp}`;

  useEffect(() => {
    let active = true;

    const fetchStream = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/rag/sources/${documentId}/view-secure`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to stream protected document`);

        const blob = await res.blob();
        if (active) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchStream();

    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [documentId]);

  // Anti-Screenshot & Blur Protection on Window Blur
  useEffect(() => {
    const handleBlur = () => setBlurActive(true);
    const handleFocus = () => setBlurActive(false);

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    // Keyboard Shortcuts Interceptor (Ctrl+P, Ctrl+S, Ctrl+C, F12, PrintScreen)
    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ['p', 'P', 's', 'S', 'c', 'C', 'u', 'U'].includes(e.key)
      ) {
        e.preventDefault();
        e.stopPropagation();
        alert('🔒 Printing, saving, and copying are disabled for protected study materials.');
        return false;
      }
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j'))) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 select-none"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* CSS Anti-Print Protection */}
      <style>{`
        @media print {
          body { display: none !important; }
        }
      `}</style>

      <div className="relative w-full max-w-5xl h-[90vh] bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-500/30">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-950 border-b border-gray-800 text-white">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-purple-900/60 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase">
              🔒 PROTECTED VIEW
            </span>
            <h3 className="font-bold text-lg text-gray-100 truncate max-w-xl">{title || 'Study Material'}</h3>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 font-semibold hidden md:inline">
              Download & Screenshot Disabled
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-bold text-sm transition-all"
            >
              ✕ Close Viewer
            </button>
          </div>
        </div>

        {/* Viewer Main Body */}
        <div className="relative flex-1 bg-gray-950 overflow-hidden flex items-center justify-center">
          {loading && (
            <div className="text-center space-y-3 text-purple-400">
              <span className="spinner w-8 h-8 mx-auto block border-purple-400"></span>
              <p className="text-sm font-semibold">Decrypting protected study material stream...</p>
            </div>
          )}

          {error && (
            <div className="p-6 bg-red-900/40 border border-red-500/40 rounded-xl text-center text-red-200 space-y-2">
              <div className="text-2xl">⚠️</div>
              <p className="font-bold text-base">Unable to stream protected document</p>
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {!loading && !error && blobUrl && (
            <div className={`relative w-full h-full transition-all duration-300 ${blurActive ? 'blur-xl grayscale' : ''}`}>
              {/* Tiled Watermark Overlay */}
              <div className="absolute inset-0 z-20 pointer-events-none grid grid-cols-2 md:grid-cols-3 gap-8 p-6 opacity-20 overflow-hidden select-none">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="transform -rotate-25 text-[11px] font-mono font-bold text-purple-300 leading-tight tracking-wider"
                  >
                    {watermarkText}
                  </div>
                ))}
              </div>

              {/* Secure Document Iframe Viewer */}
              <iframe
                src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                title="Protected Document Viewer"
                className="w-full h-full border-0 z-10"
              />
            </div>
          )}

          {/* Screenshot Deterrent Blur Overlay */}
          {blurActive && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 backdrop-blur-md text-white text-center p-6 space-y-3">
              <div className="text-4xl">🛡️</div>
              <h4 className="text-xl font-bold text-amber-400">Protected Mode Active</h4>
              <p className="text-sm text-gray-300 max-w-md">
                Screen capture and window blur detected. Click back into this window to resume viewing study material.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
