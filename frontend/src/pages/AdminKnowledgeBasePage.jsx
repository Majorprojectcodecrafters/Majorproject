import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { Skeleton } from '../components/Skeleton';

export default function AdminKnowledgeBasePage() {
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    type: 'textbook',
    subjectId: '',
    grade: '11th',
  });
  const { showToast } = useToast();

  // Fetch RAG stats
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['ragStats'],
    queryFn: async () => {
      const response = await apiClient.get('/rag/stats');
      return response.data.data;
    },
  });

  // Fetch subjects for dropdown
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/subjects');
      return response.data.data || [];
    },
  });

  const { data: ingestionStatus } = useQuery({
    queryKey: ['ingestionStatus', jobId],
    queryFn: async () => {
      const response = await apiClient.get(`/rag/ingest/${jobId}`);
      return response.data.data;
    },
    enabled: Boolean(jobId),
    refetchInterval: jobId ? 1500 : false,
  });

  useEffect(() => {
    if (!ingestionStatus || !['done', 'failed'].includes(ingestionStatus.status)) return;

    setUploading(false);
    setJobId(null);
    if (ingestionStatus.status === 'done') {
      showToast('Document uploaded and indexed successfully');
      setFile(null);
      setFormData({ type: 'textbook', subjectId: '', grade: '11th' });
      refetch();
    } else {
      showToast(ingestionStatus.message || 'Document ingestion failed', 'error');
    }
  }, [ingestionStatus, refetch, showToast]);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formDataToSend) => {
      const response = await apiClient.post('/rag/ingest', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    },
    onSuccess: (job) => {
      setJobId(job.jobId);
    },
  });

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!formData.subjectId) {
      showToast('Please select a subject', 'error');
      return;
    }

    if (!file) {
      showToast('Please select a document file', 'error');
      return;
    }

    const data = new FormData();
    data.append('pdf', file);
    data.append('type', formData.type);
    data.append('subjectId', formData.subjectId);
    data.append('subjectName', subjects.find((subject) => subject.id === formData.subjectId)?.name || 'general');
    data.append('grade', formData.grade);

    setUploading(true);
    try {
      await uploadMutation.mutateAsync(data);
    } catch (error) {
      showToast(`Upload failed: ${error.response?.data?.message || error.message}`, 'error');
    }
    if (!jobId) setUploading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Student Study Material Upload</h1>

      <div className="grid grid-cols-3 gap-8">
        {/* Upload Form */}
        <div className="col-span-2">
          <div className="card">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">Upload for Students</h2>

            <form onSubmit={handleUpload} className="space-y-4">`r`n              <p className="rounded bg-blue-50 p-3 text-sm text-blue-900">Select <strong>Textbook</strong> or <strong>Past Question Paper</strong>, then choose its grade and subject. Students in that class and subject can access it immediately after upload.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700">Document Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input-field mt-1 w-full"
                >
                  <option value="textbook">Textbook</option>
                  <option value="pyq">Past Question Paper</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Subject *</label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="input-field mt-1 w-full"
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Grade *</label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="input-field mt-1 w-full"
                >
                  <option value="11th">11th</option>
                  <option value="12th">12th</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Document File *</label>
                <input
                  type="file"
                  accept=".pdf,.docx,.pptx,.xlsx,.xls,.odt,.odp,.ods,.rtf,.csv,.txt,.md,.html,.htm,.epub,.png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="input-field mt-1 w-full"
                />
                {file && <p className="mt-1 text-sm text-gray-600">Selected: {file.name}</p>}
              </div>

              <button
                type="submit"
                disabled={uploading || !file || !formData.subjectId}
                className="btn-primary w-full"
              >
                {uploading ? 'Processing...' : 'Upload Document'}
              </button>
              {uploading && ingestionStatus && (
                <div className="rounded bg-blue-50 p-3" aria-live="polite">
                  <div className="mb-1 flex justify-between text-sm text-blue-900">
                    <span>{ingestionStatus.message}</span>
                    <span>{ingestionStatus.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-blue-100">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${ingestionStatus.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Stats */}
        <div className="col-span-1">
          <div className="card">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Knowledge Base Stats</h2>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : stats ? (
              <div className="space-y-4">
                <div className="rounded bg-blue-50 p-3">
                  <p className="text-sm text-gray-600">Total Chunks</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalChunks || 0}</p>
                </div>
                <div className="rounded bg-green-50 p-3">
                  <p className="text-sm text-gray-600">Collection</p>
                  <p className="text-sm font-medium text-gray-900">{stats.collection}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">No data</p>
            )}
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="card mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Uploaded Documents</h2>
        <p className="text-gray-600">
          Note: Document management features can be expanded to show ingestion status,
          delete/deprecate options, and per-document chunk counts.
        </p>
      </div>
    </div>
  );
}
