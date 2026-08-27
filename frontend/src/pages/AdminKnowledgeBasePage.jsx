import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { Skeleton } from '../components/Skeleton';

export default function AdminKnowledgeBasePage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    sourceType: 'TEXTBOOK',
    classId: '',
    subjectId: '',
    chapterId: '',
    topicId: '',
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

  // 3. Fetch Chapters for Selected Subject
  const { data: chapters = [] } = useQuery({
    queryKey: ['curriculum-chapters', formData.subjectId],
    queryFn: async () => {
      if (!formData.subjectId) return [];
      const res = await apiClient.get(`/curriculum/chapters?subjectId=${formData.subjectId}`);
      return res.data.data || [];
    },
    enabled: !!formData.subjectId
  });

  // 4. Fetch RAG stats & Knowledge Sources List
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['ragStats'],
    queryFn: async () => {
      const res = await apiClient.get('/rag/stats');
      return res.data.data;
    }
  });

  const { data: sources = [], refetch: refetchSources } = useQuery({
    queryKey: ['knowledgeSources', formData.classId, formData.subjectId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (formData.classId) params.append('classId', formData.classId);
      if (formData.subjectId) params.append('subjectId', formData.subjectId);
      const res = await apiClient.get(`/rag/sources?${params.toString()}`);
      return res.data.data || [];
    }
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (fdToSend) => {
      const res = await apiClient.post('/rag/ingest', fdToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data.data;
    },
    onSuccess: () => {
      showToast('Knowledge source uploaded and indexed cleanly!', 'success');
      setFile(null);
      setFormData({
        title: '',
        sourceType: 'TEXTBOOK',
        classId: formData.classId,
        subjectId: formData.subjectId,
        chapterId: '',
        topicId: '',
        description: ''
      });
      refetchSources();
      queryClient.invalidateQueries({ queryKey: ['ragStats'] });
    },
    onError: (err) => {
      showToast(`Upload failed: ${err.response?.data?.message || err.message}`, 'error');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (sourceId) => {
      const res = await apiClient.delete(`/rag/source/${sourceId}`);
      return res.data;
    },
    onSuccess: () => {
      showToast('Knowledge source deleted successfully', 'success');
      refetchSources();
      queryClient.invalidateQueries({ queryKey: ['ragStats'] });
    }
  });

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!formData.classId || !formData.subjectId) {
      showToast('Please select Class and Subject', 'error');
      return;
    }

    if (!file) {
      showToast('Please select a PDF document file', 'error');
      return;
    }

    const data = new FormData();
    data.append('pdf', file);
    data.append('title', formData.title || file.name);
    data.append('sourceType', formData.sourceType);
    data.append('classId', formData.classId);
    data.append('subjectId', formData.subjectId);
    if (formData.chapterId) data.append('chapterId', formData.chapterId);
    if (formData.topicId) data.append('topicId', formData.topicId);
    if (formData.description) data.append('description', formData.description);

    setUploading(true);
    try {
      await uploadMutation.mutateAsync(data);
    } finally {
      setUploading(false);
    }
  };

  const [syncing, setSyncing] = useState(false);

  // Fetch full Google Drive folder tree for Admin
  const { data: driveTreeData, refetch: refetchDriveTree, isLoading: driveTreeLoading } = useQuery({
    queryKey: ['adminDriveTree'],
    queryFn: async () => {
      const res = await apiClient.get('/student-library/admin-tree');
      return res.data.data;
    }
  });

  const handleDriveSync = async () => {
    setSyncing(true);
    try {
      const res = await apiClient.post('/student-library/sync');
      showToast(res.data.message || 'Google Drive Sync Complete!', 'success');
      refetchDriveTree();
      queryClient.invalidateQueries(['knowledge-sources']);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to sync Google Drive', 'error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Curriculum-Mapped Knowledge & Google Drive Explorer</h1>
          <p className="text-sm text-gray-600">
            Upload textbooks, notes, and PYQs mapped to Curriculum, or sync connected Google Drive folders.
          </p>
        </div>
        <button
          onClick={handleDriveSync}
          disabled={syncing}
          className="btn-primary flex items-center gap-2 text-sm font-bold py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md"
        >
          {syncing ? <><span className="spinner mr-2"></span>Syncing Drive...</> : '🔄 Sync Connected Google Drive'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Upload Form */}
        <div className="md:col-span-2">
          <div className="card space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">+ Add Educational Resource</h2>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Source Type */}
                <div>
                  <label className="label">Resource Type *</label>
                  <select
                    value={formData.sourceType}
                    onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })}
                    className="input-field"
                  >
                    <option value="TEXTBOOK">Textbook (Official)</option>
                    <option value="CHAPTER_NOTES">Chapter Notes</option>
                    <option value="TEACHER_NOTES">Teacher Notes</option>
                    <option value="QUESTION_GLOSSARY">Question Glossary</option>
                    <option value="QUESTION_BANK">Question Bank</option>
                    <option value="PREVIOUS_BOARD_PAPER">Previous Board Paper</option>
                    <option value="SAMPLE_PAPER">Sample / Model Paper</option>
                    <option value="REFERENCE_MATERIAL">Reference Material</option>
                    <option value="STUDY_MATERIAL">Study Material</option>
                    <option value="OTHER">Other Resource</option>
                  </select>
                </div>

                {/* Document Title */}
                <div>
                  <label className="label">Resource Title</label>
                  <input
                    type="text"
                    placeholder="e.g. HSC 12th Physics Textbook 2026 Edition"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Class & Subject Cascading Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Class / Standard *</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value, subjectId: '', chapterId: '' })}
                    className="input-field"
                  >
                    <option value="">-- Select Class --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.stream?.name || 'Science'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Subject *</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value, chapterId: '' })}
                    className="input-field"
                    disabled={!formData.classId}
                  >
                    <option value="">-- Select Subject --</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chapter & Topic Mapping (Optional for full subject resources) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Chapter Mapping (Optional)</label>
                  <select
                    value={formData.chapterId}
                    onChange={(e) => setFormData({ ...formData, chapterId: e.target.value })}
                    className="input-field"
                    disabled={!formData.subjectId}
                  >
                    <option value="">-- Entire Subject --</option>
                    {chapters.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.chapterNo ? `Ch ${ch.chapterNo}: ` : ''}{ch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Document File (PDF) *</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="input-field"
                  />
                  {file && <p className="mt-1 text-xs text-gray-600 font-medium">Selected: {file.name}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading || !file || !formData.classId || !formData.subjectId}
                className="btn-primary w-full"
              >
                {uploading ? '🤖 Processing & Indexing into ChromaDB...' : '📤 Upload & Index Knowledge Source'}
              </button>
            </form>
          </div>
        </div>

        {/* Stats Column */}
        <div className="md:col-span-1 space-y-4">
          <div className="card">
            <h2 className="text-base font-bold text-gray-900 mb-3 border-b pb-2">Vector DB Stats</h2>
            {statsLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : stats ? (
              <div className="space-y-3 text-xs">
                <div className="bg-blue-50 p-3 rounded border border-blue-100">
                  <span className="text-blue-700 block">Total Vectors & Chunks</span>
                  <span className="text-2xl font-bold text-blue-900">{stats.totalChunks || 0}</span>
                </div>
                <div className="bg-green-50 p-3 rounded border border-green-100">
                  <span className="text-green-700 block">Indexed Sources</span>
                  <span className="text-xl font-bold text-green-900">{stats.totalSources || 0}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">No stats available</p>
            )}
          </div>
        </div>
      </div>

      {/* Indexed Knowledge Sources List */}
      <div className="card mt-8 space-y-4">
        <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Indexed Curriculum Knowledge Sources</h2>

        {sources.length === 0 ? (
          <p className="text-xs text-gray-500 italic py-4">No curriculum knowledge sources uploaded yet.</p>
        ) : (
          <div className="divide-y max-h-96 overflow-y-auto">
            {sources.map((src) => (
              <div key={src.id} className="py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="space-y-1 max-w-lg">
                  <div className="font-bold text-gray-900 text-sm">{src.title}</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">{src.sourceType}</span>
                    <span className="text-gray-600">{src.class?.name || 'Class'} • {src.subject?.name || 'Subject'}</span>
                    {src.chapter && <span className="text-gray-500">• {src.chapter.name}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${src.status === 'PROCESSED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                    {src.status}
                  </span>
                  <button
                    onClick={() => deleteMutation.mutate(src.id)}
                    className="text-red-600 hover:text-red-800 font-semibold"
                  >
                    Delete 🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
