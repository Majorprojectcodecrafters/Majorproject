import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Skeleton } from '../components/Skeleton';
import ProtectedDocumentViewer from '../components/ProtectedDocumentViewer';

export default function AdminKnowledgeBasePage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('materials'); // 'materials' | 'tree'
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [file, setFile] = useState(null);
  const [activeDocument, setActiveDocument] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'TEXTBOOK', // "TEXTBOOK", "TEACHER_NOTES", "CHAPTER_NOTES", "PREVIOUS_BOARD_PAPER", "REFERENCE_MATERIAL"
    classId: '',
    subjectId: '',
    description: '',
    indexToRag: true
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
        description: '',
        indexToRag: false
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
      showToast(err.response?.data?.message || 'Failed to delete material', 'error');
    }
  });

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      showToast('Please select a PDF document', 'error');
      return;
    }

    const data = new FormData();
    data.append('file', file);
    if (formData.title) data.append('title', formData.title);
    data.append('category', formData.category);
    if (formData.classId) data.append('classId', formData.classId);
    if (formData.subjectId) data.append('subjectId', formData.subjectId);
    if (formData.description) data.append('description', formData.description);
    data.append('indexToRag', formData.indexToRag.toString());

    setUploading(true);
    try {
      await uploadMutation.mutateAsync(data);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 select-none">
      {/* Top Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('adminKnowledgeBaseTitle', 'Student Library & Google Drive Explorer')}</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {t('adminKnowledgeBaseSubtitle', 'Manage textbooks, notes, and previous year question papers stored on Google Drive for students.')}
          </p>
        </div>

        <button
          onClick={handleDriveSync}
          disabled={syncing}
          className="btn-primary flex items-center gap-2 text-xs font-bold py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
        >
          {syncing ? <><span className="spinner mr-2"></span>{t('syncingDrive', 'Syncing Drive...')}</> : t('syncConnectedDrive', 'Sync Connected Google Drive')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Upload Form */}
        <div className="md:col-span-2">
          <div className="card space-y-4 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              {t('uploadStudyMaterialTitle', 'Upload Study Material to Google Drive')}
            </h2>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Resource Category */}
                <div>
                  <label className="label font-bold text-xs text-slate-700">{t('resourceCategoryLabel', 'Resource Category')} *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field mt-1"
                  >
                    <option value="TEXTBOOK">{t('officialTextbook', 'Official Textbook')}</option>
                    <option value="TEACHER_NOTES">{t('teacherNotes', 'Teacher / Chapter Notes')}</option>
                    <option value="PREVIOUS_BOARD_PAPER">{t('pyqPaper', 'Previous Board Paper (PYQ)')}</option>
                    <option value="SAMPLE_PAPER">{t('samplePaper', 'Sample / Model Paper')}</option>
                    <option value="REFERENCE_MATERIAL">{t('referenceMaterial', 'Reference Material')}</option>
                  </select>
                </div>

                {/* Document Title */}
                <div>
                  <label className="label font-bold text-xs text-slate-700">{t('resourceTitleLabel', 'Resource Title')}</label>
                  <input
                    type="text"
                    placeholder="e.g. HSC 12th Physics Textbook 2026"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field mt-1"
                  />
                </div>
              </div>

              {/* Class & Subject Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label font-bold text-xs text-slate-700">{t('classGradeTargetLabel', 'Class / Grade Target')}</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value, subjectId: '' })}
                    className="input-field mt-1"
                  >
                    <option value="">{t('allClassesGeneral', '-- All Classes / General --')}</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.academicYear})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label font-bold text-xs text-slate-700">{t('subjectTargetLabel', 'Subject Target')}</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="input-field mt-1"
                    disabled={!formData.classId}
                  >
                    <option value="">{t('allSubjects', '-- All Subjects --')}</option>
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
                  <label className="label font-bold text-xs text-slate-700">{t('descriptionNotesLabel', 'Description / Notes')}</label>
                  <input
                    type="text"
                    placeholder="Optional description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field mt-1"
                  />
                </div>

                <div>
                  <label className="label font-bold text-xs text-slate-700">{t('pdfDocumentLabel', 'PDF Document')} *</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="input-field mt-1 text-xs"
                  />
                  {file && <p className="mt-1 text-xs text-blue-700 font-semibold">Selected: {file.name}</p>}
                </div>
              </div>

              {/* Optional RAG Indexing Checkbox */}
              <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200/80">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-blue-950">
                  <input
                    type="checkbox"
                    checked={formData.indexToRag}
                    onChange={(e) => setFormData({ ...formData, indexToRag: e.target.checked })}
                    className="h-4 w-4 rounded border-blue-300 text-blue-700 focus:ring-blue-500"
                  />
                  <span>{t('indexToRagLabel', 'Also index into ChromaDB Vector Store for AI Question Paper Generation')}</span>
                </label>
                <p className="text-[11px] text-blue-700 mt-1 pl-6 leading-tight font-medium">
                  {t('indexToRagHelp', 'Unchecked (Default): Saves cleanly as a Student Library study material on Google Drive without chunking compute overhead.')}
                </p>
              </div>

              <button
                type="submit"
                disabled={uploading || !file}
                className="btn-primary w-full py-3 font-bold text-xs"
              >
                {uploading ? <><span className="spinner mr-2"></span>Uploading to Google Drive...</> : 'Upload to Google Drive'}
              </button>
            </form>
          </div>
        </div>

        {/* Stats Column */}
        <div className="md:col-span-1 space-y-4">
          <div className="card shadow-sm border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">
              {t('googleDriveOverviewTitle', 'Google Drive Storage Overview')}
            </h2>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="text-xs text-blue-700 font-bold">{t('syncedStudyMaterials', 'Synced Study Materials')}</div>
                <div className="text-2xl font-black text-blue-900 mt-0.5">{materials.length}</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="text-xs text-blue-700 font-bold">{t('driveSubfoldersExplored', 'Drive Subfolders Explored')}</div>
                <div className="text-2xl font-black text-blue-900 mt-0.5">{driveTreeData?.folderTree?.length || 0}</div>
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
              ? 'border-blue-600 text-blue-800 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Synced Study Materials ({materials.length})
        </button>
        <button
          onClick={() => setActiveTab('tree')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'tree'
              ? 'border-blue-600 text-blue-800 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Google Drive Hierarchy Tree ({driveTreeData?.folderTree?.length || 0} Folders)
        </button>
      </div>

      {/* Tab 1: Synced Study Materials */}
      {activeTab === 'materials' && (
        <div className="card shadow-sm border border-slate-200">
          {materialsLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : materials.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="font-semibold text-slate-700">No study materials found in Google Drive</p>
              <p className="text-xs text-slate-500 mt-1">Click "Sync Connected Google Drive" to discover uploaded textbooks and notes.</p>
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
                          item.category === 'TEXTBOOK' ? 'bg-blue-100 text-blue-800' :
                          item.category === 'PREVIOUS_BOARD_PAPER' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-800'
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
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveDocument(item)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg transition-colors inline-flex items-center justify-center shadow-xs"
                            title="View Document"
                          >
                            <svg className="w-4 h-4 text-slate-700 fill-current" viewBox="0 0 24 24">
                              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete "${item.title}" from Google Drive?`)) {
                                deleteMutation.mutate(item.id);
                              }
                            }}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 rounded-lg transition-colors inline-flex items-center justify-center shadow-xs"
                            title="Delete Document"
                          >
                            <svg className="w-4 h-4 text-red-600 fill-current" viewBox="0 0 24 24">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                            </svg>
                          </button>
                        </div>
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
          <h3 className="font-bold text-slate-900 mb-4">
            Google Drive Connected Root Folder Hierarchy
          </h3>
          {driveTreeLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : !driveTreeData?.folderTree || driveTreeData.folderTree.length === 0 ? (
            <p className="text-sm text-slate-500">No subfolders detected in Google Drive root folder.</p>
          ) : (
            <div className="space-y-2 font-mono text-xs text-slate-700 bg-slate-900 text-slate-100 p-6 rounded-xl overflow-x-auto shadow-inner">
              <div className="text-emerald-400 font-bold mb-3">ROOT: Google Drive [1lt8-tHT6wniWRLwPrsZizWmFCJQ423r3]</div>
              {driveTreeData.folderTree.map((folder) => (
                <div key={folder.id} className="hover:text-emerald-300 transition-colors flex items-center gap-2 py-1">
                  <span className="font-semibold text-slate-200">{folder.path}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Document Viewer Modal */}
      {activeDocument && (
        <ProtectedDocumentViewer
          documentId={activeDocument.id}
          documentTitle={activeDocument.title}
          fileUrl={activeDocument.fileUrl}
          driveFileId={activeDocument.driveFileId}
          onClose={() => setActiveDocument(null)}
        />
      )}
    </div>
  );
}
