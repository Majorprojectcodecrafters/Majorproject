import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Skeleton } from '../components/Skeleton';

export default function PaperViewerPage() {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [showSources, setShowSources] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewing, setPreviewing] = useState(false);
  // PDF export (/teacher/qp/:id/export/...) is restricted to the owning
  // teacher on the backend, so only teachers get the download buttons here.
  const canDownload = user?.role === 'TEACHER';

  const { data: paper, isLoading, error } = useQuery({
    queryKey: ['paper', paperId],
    queryFn: async () => {
      const response = await apiClient.get(`/question-papers/${paperId}`);
      return response.data.data;
    },
  });

  // Download PDF
  const downloadPDF = async (type) => {
    try {
      const response = await apiClient.get(
        `/teacher/qp/${paperId}/export/${type === 'student' ? 'student' : 'teacher'}`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${paper.title}-${type}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      showToast(`Download failed: ${error.message}`, 'error');
    }
  };

  const previewPDF = async () => {
    setPreviewing(true);
    try {
      const response = await apiClient.get(
        `/teacher/qp/${paperId}/export/student`,
        { responseType: 'blob' }
      );
      setPreviewUrl(window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' })));
    } catch (error) {
      showToast(`PDF preview failed: ${error.message}`, 'error');
    } finally {
      setPreviewing(false);
    }
  };

  useEffect(() => () => {
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.patch(`/question-papers/${paperId}/publish`);
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Question paper published successfully');
      queryClient.invalidateQueries({ queryKey: ['paper', paperId] });
      queryClient.invalidateQueries({ queryKey: ['questionPapers'] });
      queryClient.invalidateQueries({ queryKey: ['studentPublishedQPs'] });
    },
    onError: (error) => showToast(`Publish failed: ${error.response?.data?.message || error.message}`, 'error'),
  });

  const backPath =
    user?.role === 'ADMIN'
      ? '/admin/dashboard'
      : user?.role === 'STUDENT'
      ? '/student/papers'
      : '/dashboard';

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6 px-4 py-8">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          Failed to load question paper
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(backPath)}
            className="mb-4 text-blue-600 hover:text-blue-900"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{paper.title}</h1>
          <p className="mt-2 text-gray-600">{paper.subject?.name}</p>
        </div>

        <div className="flex gap-2">
          {canDownload && paper.status === 'DRAFT' && (
            <button
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
              className="btn-primary"
            >
              {publishMutation.isPending ? 'Publishing...' : 'Publish'}
            </button>
          )}
          {canDownload && (
            <>
              <button onClick={previewPDF} disabled={previewing} className="btn-secondary">
                {previewing ? 'Preparing preview...' : 'Preview PDF'}
              </button>
              <button onClick={() => downloadPDF('student')} className="btn-secondary">
                Download (Student)
              </button>
              <button onClick={() => downloadPDF('teacher')} className="btn-secondary">
                Download (Answer Key)
              </button>
            </>
          )}
        </div>
      </div>

      {/* Paper Metadata */}
      <div className="card mb-8">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Marks</p>
            <p className="font-semibold text-gray-900">{paper.totalMarks}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Duration</p>
            <p className="font-semibold text-gray-900">{paper.durationMins} minutes</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Difficulty</p>
            <p className="font-semibold text-gray-900">{paper.difficulty}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <span className={`badge ${
              paper.status === 'PUBLISHED' ? 'badge-success' : 'badge-warning'
            }`}>
              {paper.status}
            </span>
          </div>
        </div>

        {paper.instructions && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <p className="text-sm font-medium text-gray-900">Instructions:</p>
            <p className="mt-1 text-gray-600">{paper.instructions}</p>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {paper.questions && paper.questions.length > 0 ? (
          paper.questions.map((qp, idx) => {
            const question = qp.question;
            return (
              <div key={question.id} className="card">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      Q{idx + 1}. {question.questionText}
                    </h3>
                    <div className="mt-2 flex gap-4">
                      <span className="badge badge-info">{question.marks} marks</span>
                      <span className="badge badge-warning">{question.difficulty}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSources(!showSources)}
                    className="text-sm text-blue-600 hover:text-blue-900"
                  >
                    {showSources ? 'Hide' : 'Show'} Sources
                  </button>
                </div>

                {question.options && question.options.length > 0 && (
                  <div className="mb-3 space-y-1 rounded bg-gray-50 p-3">
                    {question.options.map((opt, i) => (
                      <p key={i} className="text-sm text-gray-600">
                        {opt}
                      </p>
                    ))}
                  </div>
                )}

                {question.answerKey && (
                  <div className="rounded bg-green-50 p-3">
                    <p className="text-sm font-medium text-green-900">Answer Key:</p>
                    <p className="mt-1 text-sm text-green-800">{question.answerKey}</p>
                  </div>
                )}

                {showSources && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <p className="mb-2 text-sm font-medium text-gray-900">
                      ℹ️ RAG Sources (Retrieved Context)
                    </p>
                    <div className="rounded bg-blue-50 p-3 text-sm text-gray-700">
                      <p>
                        This question was generated using RAG (Retrieval-Augmented Generation)
                        from your knowledge base. The system retrieved relevant chapters and
                        past papers to create contextually appropriate questions.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-gray-600">No questions in this paper.</p>
        )}
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900">Student PDF Preview</h2>
              <button
                type="button"
                onClick={() => setPreviewUrl('')}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>
            <iframe
              title="Student PDF preview"
              src={previewUrl}
              className="min-h-0 flex-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}
