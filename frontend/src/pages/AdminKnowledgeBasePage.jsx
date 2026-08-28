import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { Skeleton } from '../components/Skeleton';
import ProtectedDocumentViewer from '../components/ProtectedDocumentViewer';

export default function AdminKnowledgeBasePage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('materials'); // 'materials' | 'tree'
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [file, setFile] = useState(null);
  const [activeDocument, setActiveDocument] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'TEACHER_NOTES', // "TEACHER_NOTES", "CHAPTER_NOTES", "TEXTBOOK", "PREVIOUS_BOARD_PAPER", "REFERENCE_MATERIAL"
    classId: '',
    subjectId: '',
    description: ''
  });

  // 1. Fetch Classes
  const { data: classes = [] } = useQuery({
    queryKey: ['curriculum-classes'],
    queryFn: async () => {
      const res = await apiClient.get('/curriculum/classes');
      return res.data.data || [];
    }
  });

  // 2. Fetch Subjects for Selected Class
  const { data: subjects = [] } = useQuery({
    queryKey: ['curriculum-subjects', formData.classId],
    queryFn: async () => {
      if (!formData.classId) return [];
      const res = await apiClient.get(`/curriculum/subjects?classId=${formData.classId}`);
      return res.data.data || [];
    },
    enabled: !!formData.classId
  });

  // 3. Fetch Student Library Study Materials
  const { data: materials = [], isLoading: materialsLoading, refetch: refetchMaterials } = useQuery({
    queryKey: ['adminStudyMaterials', formData.classId, formData.subjectId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (formData.classId) params.append('classId', formData.classId);
      if (formData.subjectId) params.append('subjectId', formData.subjectId);
      const res = await apiClient.get(`/student-library/materials?${params.toString()}`);
      return res.data.data || [];
    }
  });

  // 4. Fetch Full Google Drive Folder Tree for Admin
  const { data: driveTreeData, refetch: refetchDriveTree, isLoading: driveTreeLoading } = useQuery({
    queryKey: ['adminDriveTree'],
    queryFn: async () => {
      const res = await apiClient.get('/student-library/admin-tree');
      return res.data.data;
    }
  });

  // Handle Google Drive Sync
  const handleDriveSync = async () => {
    setSyncing(true);
    try {
      const res = await apiClient.post('/student-library/sync');
      showToast(res.data.message || 'Google Drive Sync Complete!', 'success');
      refetchMaterials();
      refetchDriveTree();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to sync Google Drive', 'error');
    } finally {
      setSyncing(false);
    }
  };

  // Upload Study Material Mutation
  const uploadMutation = useMutation({
    mutationFn: async (fdToSend) => {
      const res = await apiClient.post('/student-library/upload', fdToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data.data;
    },
    onSuccess: () => {
      showToast('Study material uploaded cleanly to Google Drive!', 'success');
      setFile(null);
      setFormData({
        title: '',
        category: 'TEACHER_NOTES',
        classId: formData.classId,
        subjectId: formData.subjectId,
        description: ''
      });
      refetchMaterials();
      refetchDriveTree();
    },
    onError: (err) => {
      showToast(`Upload failed: ${err.response?.data?.message || err.message}`, 'error');
    }
  });

  // Delete Material Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiClient.delete(`/student-library/materials/${id}`);
      return res.data;
    },
    onSuccess: () => {
      showToast('Study material deleted successfully from Google Drive!', 'success');
      refetchMaterials();
      refetchDriveTree();
    },
    onError: (err) => {
      showToast(`Delete failed: ${err.response?.data?.message || err.message}`, 'error');
    }
  });

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      showToast('Please select a PDF document file', 'error');
      return;
    }

    const data = new FormData();
    data.append('file', file);
    data.append('title', formData.title || file.name);
    data.append('category', formData.category);
    if (formData.classId) data.append('classId', formData.classId);
    if (formData.subjectId) data.append('subjectId', formData.subjectId);
    if (formData.description) data.append('description', formData.description);

    setUploading(true);
    try {
      await uploadMutation.mutateAsync(data);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <h1 className="text-2xl font-bold text-gray-900">Student Library & Google Drive Explorer</h1>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Manage textbooks, notes, and previous year question papers stored on Google Drive for students.
          </p>
        </div>

        <button
          onClick={handleDriveSync}
          disabled={syncing}
          className="btn-primary flex items-center gap-2 text-sm font-bold py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md"
        >
          {syncing ? <><span className="spinner mr-2"></span>Syncing Drive...</> : '🔄 Sync Connected Google Drive'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Upload Form */}
        <div className="md:col-span-2">
          <div className="card space-y-4 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <span>📤</span> Upload Study Material to Google Drive
            </h2>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Resource Category */}
                <div>
                  <label className="label font-semibold">Resource Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                  >
                    <option value="TEXTBOOK">Official Textbook</option>
                    <option value="TEACHER_NOTES">Teacher / Chapter Notes</option>
                    <option value="PREVIOUS_BOARD_PAPER">Previous Board Paper (PYQ)</option>
                    <option value="SAMPLE_PAPER">Sample / Model Paper</option>
                    <option value="REFERENCE_MATERIAL">Reference Material</option>
                  </select>
                </div>

                {/* Document Title */}
                <div>
                  <label className="label font-semibold">Resource Title</label>
                  <input
                    type="text"
                    placeholder="e.g. HSC 12th Physics Textbook 2026"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Class & Subject Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label font-semibold">Class / Grade Target</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value, subjectId: '' })}
                    className="input-field"
                  >
                    <option value="">-- All Classes / General --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.academicYear})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label font-semibold">Subject Target</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="input-field"
                    disabled={!formData.classId}
                  >
                    <option value="">-- All Subjects --</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description & File Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label font-semibold">Description / Notes</label>
                  <input
                    type="text"
                    placeholder="Optional description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label font-semibold">PDF Document *</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="input-field"
                  />
                  {file && <p className="mt-1 text-xs text-purple-700 font-semibold">Selected: {file.name}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading || !file}
                className="btn-primary w-full py-3 font-bold text-sm bg-purple-700 hover:bg-purple-800"
              >
                {uploading ? <><span className="spinner mr-2"></span>Uploading to Google Drive...</> : '☁️ Upload to Google Drive'}
              </button>
            </form>
          </div>
        </div>

        {/* Stats Column */}
        <div className="md:col-span-1 space-y-4">
          <div className="card shadow-sm border border-slate-200">
            <h2 className="text-base font-bold text-gray-900 mb-3 border-b pb-2 flex items-center gap-2">
              <span>📊</span> Google Drive Storage Overview
            </h2>
            <div className="space-y-3 text-xs">
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <span className="text-purple-700 font-semibold block">Synced Study Materials</span>
                <span className="text-3xl font-extrabold text-purple-900">{materials.length}</span>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <span className="text-blue-700 font-semibold block">Drive Subfolders Explored</span>
                <span className="text-3xl font-extrabold text-blue-900">{driveTreeData?.folderTree?.length || 0}</span>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-900 font-medium leading-relaxed">
                🔒 Files stored on Google Drive are protected with download/copy lockdown & anti-screenshot watermarking for students.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Admin */}
      <div className="mt-10 mb-6 flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('materials')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'materials'
              ? 'border-purple-700 text-purple-900 bg-purple-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          📂 Synced Study Materials ({materials.length})
        </button>
        <button
          onClick={() => setActiveTab('tree')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'tree'
              ? 'border-purple-700 text-purple-900 bg-purple-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          🌳 Google Drive Hierarchy Tree ({driveTreeData?.folderTree?.length || 0} Folders)
        </button>
      </div>

      {/* Tab 1: Synced Study Materials */}
      {activeTab === 'materials' && (
        <div className="card shadow-sm border border-slate-200">
          {materialsLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : materials.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <span className="text-4xl block mb-2">📭</span>
              <p className="font-semibold text-slate-700">No study materials found in Google Drive</p>
              <p className="text-xs text-slate-500 mt-1">Click "🔄 Sync Connected Google Drive" to discover uploaded textbooks and notes.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-700 text-xs uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Class / Grade</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Folder Path</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 text-xs">
                  {materials.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {item.title}
                        <span className="block font-mono text-[10px] text-slate-400 font-normal">{item.fileName}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.category === 'TEXTBOOK' ? 'bg-purple-100 text-purple-800' :
                          item.category === 'PREVIOUS_BOARD_PAPER' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {item.class?.name || 'All Classes'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {item.subject?.name || 'General'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                        {item.description || 'Google Drive'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => setActiveDocument(item)}
                          className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold text-xs shadow-sm"
                        >
                          👁️ View Protected PDF
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete "${item.title}" from Google Drive?`)) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold text-xs"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Full Google Drive Hierarchy Tree */}
      {activeTab === 'tree' && (
        <div className="card shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span>🌳</span> Google Drive Connected Root Folder Hierarchy
          </h3>
          {driveTreeLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : !driveTreeData?.folderTree || driveTreeData.folderTree.length === 0 ? (
            <p className="text-sm text-slate-500">No subfolders detected in Google Drive root folder.</p>
          ) : (
            <div className="space-y-2 font-mono text-xs text-slate-700 bg-slate-900 text-slate-100 p-6 rounded-xl overflow-x-auto shadow-inner">
              <div className="text-emerald-400 font-bold mb-3">ROOT: Google Drive [16_gh9hL3CHaHQ59KU7N2ejhIdKQ0rhJw]</div>
              {driveTreeData.folderTree.map((folder) => (
                <div key={folder.id} className="hover:text-emerald-300 transition-colors flex items-center gap-2 py-1">
                  <span className="text-slate-500">📁</span>
                  <span className="font-semibold text-slate-200">{folder.path}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Protected Document Viewer Modal */}
      {activeDocument && (
        <ProtectedDocumentViewer
          documentId={activeDocument.id}
          documentTitle={activeDocument.title}
          onClose={() => setActiveDocument(null)}
        />
      )}
    </div>
  );
}
