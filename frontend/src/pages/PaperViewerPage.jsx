import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatScientificText } from '../utils/formatScientific';
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

  // Question editing state
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editFormData, setEditFormData] = useState({
    questionText: '',
    options: ['', '', '', ''],
    answerKey: '',
    marks: 1,
    difficulty: 'MEDIUM'
  });

  const isTeacher = user?.role === 'TEACHER';
  const isAdmin = user?.role === 'ADMIN';
  const canEditOrManage = isTeacher || isAdmin;

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
    } catch (err) {
      showToast(`Download failed: ${err.message}`, 'error');
    }
  };

  const previewPDF = async () => {
    setPreviewing(true);
    try {
      const response = await apiClient.get(
        `/teacher/qp/${paperId}/export/student`,
        { responseType: 'blob' }
      );
      if (previewUrl) window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' })));
    } catch (err) {
      showToast(`PDF preview failed: ${err.message}`, 'error');
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
      showToast('Question paper published successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['paper', paperId] });
      queryClient.invalidateQueries({ queryKey: ['questionPapers'] });
    },
    onError: (err) => showToast(`Publish failed: ${err.response?.data?.message || err.message}`, 'error'),
  });

  // Question update mutation (updates ONLY the selected question record in DB)
  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put(`/teacher/questions/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Question updated successfully!', 'success');
      setEditingQuestion(null);
      // Invalidate queries so paper details update instantly without browser refresh
      queryClient.invalidateQueries({ queryKey: ['paper', paperId] });
      // Invalidate cached PDF preview so new PDF uses edited question
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
      }
    },
    onError: (err) => {
      showToast(`Unable to update question: ${err.response?.data?.message || err.message}`, 'error');
    }
  });

  const openEditModal = (q) => {
    setEditingQuestion(q);
    const optionsArr = q.options && Array.isArray(q.options) && q.options.length === 4
      ? [...q.options]
      : ['', '', '', ''];

    setEditFormData({
      questionText: q.questionText || '',
      options: optionsArr,
      answerKey: q.answerKey || '',
      marks: q.marks || 1,
      difficulty: q.difficulty || 'MEDIUM'
    });
  };

  const handleEditOptionChange = (index, value) => {
    const newOpts = [...editFormData.options];
    newOpts[index] = value;
    setEditFormData(prev => ({ ...prev, options: newOpts }));
  };

  const handleSaveQuestionEdit = (e) => {
    e.preventDefault();
    if (!editingQuestion) return;

    const isMcq = (editingQuestion.options && editingQuestion.options.length > 0) || editingQuestion.questionType === 'MCQ' || editingQuestion.type === 'MCQ';

    const payload = {
      questionText: editFormData.questionText,
      marks: Number(editFormData.marks),
      difficulty: editFormData.difficulty,
      answerKey: editFormData.answerKey,
      options: isMcq ? editFormData.options : null
    };

    updateQuestionMutation.mutate({ id: editingQuestion.id, data: payload });
  };

  const backPath =
    isAdmin
      ? '/admin/dashboard'
      : user?.role === 'STUDENT'
      ? '/student/papers'
      : '/dashboard';

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6 px-4 py-8 max-w-5xl">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          Failed to load question paper.
        </div>
      </div>
    );
  }

  const questionsList = (paper.questions || []).map(qpItem => qpItem.question || qpItem);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Top Bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <button
            onClick={() => navigate(backPath)}
            className="mb-2 text-sm font-semibold text-blue-600 hover:text-blue-900 flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{paper.title}</h1>
          <p className="mt-1 text-gray-600">{paper.subject?.name} • {paper.grade || 'Class 12th'}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEditOrManage && paper.status === 'DRAFT' && (
            <button
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
              className="btn-primary"
            >
              {publishMutation.isPending ? 'Publishing...' : 'Publish'}
            </button>
          )}
          {canEditOrManage && (
            <>
              <button onClick={previewPDF} disabled={previewing} className="btn-secondary">
                {previewing ? 'Preparing...' : '📄 Preview PDF'}
              </button>
              <button onClick={() => downloadPDF('student')} className="btn-secondary">
                ⬇️ Student PDF
              </button>
              <button onClick={() => downloadPDF('teacher')} className="btn-secondary">
                🔑 Answer Key PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Paper Metadata */}
      <div className="card mb-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-500">Total Marks</p>
            <p className="text-lg font-bold text-gray-900">{paper.totalMarks}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-500">Duration</p>
            <p className="text-lg font-bold text-gray-900">{paper.durationMins} mins</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-500">Exam Date</p>
            <p className="text-lg font-bold text-gray-900">
              {paper.examDate ? new Date(paper.examDate).toLocaleDateString() : new Date(paper.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-500">Status</p>
            <span className={`badge mt-1 ${
              paper.status === 'PUBLISHED' ? 'badge-success' : 'badge-warning'
            }`}>
              {paper.status}
            </span>
          </div>
        </div>

        {paper.instructions && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-500">Instructions:</p>
            <p className="mt-1 text-sm text-gray-700">{paper.instructions}</p>
          </div>
        )}
      </div>

      {/* Header & Question Count Audit */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          Generated Questions ({questionsList.length})
        </h2>
        <button
          onClick={() => setShowSources(!showSources)}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800"
        >
          {showSources ? 'Hide RAG Context' : 'Show RAG Context'}
        </button>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questionsList.length > 0 ? (
          questionsList.map((q, idx) => {
            const isMcq = (q.options && q.options.length > 0) || q.questionType === 'MCQ' || q.type === 'MCQ';

            return (
              <div key={q.id || idx} className="card relative border-l-4 border-blue-600">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-gray-900">Q{idx + 1}.</span>
                      <h3
                        className="font-semibold text-gray-900 text-base"
                        dangerouslySetInnerHTML={{ __html: formatScientificText(q.questionText) }}
                      />
                    </div>

                    {/* Optional Figure / Diagram Image for Biology or Physics/Chemistry */}
                    {(q.imageUrl || q.diagramUrl) && (
                      <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
                        <img
                          src={q.imageUrl || q.diagramUrl}
                          alt={`Diagram for Q${idx + 1}`}
                          className="mx-auto max-h-64 object-contain rounded shadow-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500 italic">Figure for Question {idx + 1}</p>
                      </div>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="badge badge-info">{q.marks} Mark{q.marks > 1 ? 's' : ''}</span>
                      <span className="badge badge-warning">{q.difficulty}</span>
                      {q.questionType && <span className="badge bg-gray-100 text-gray-800">{q.questionType}</span>}
                    </div>
                  </div>

                  {canEditOrManage && (
                    <button
                      type="button"
                      onClick={() => openEditModal(q)}
                      className="rounded bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      ✏️ Edit Question
                    </button>
                  )}
                </div>

                {/* Options for MCQ */}
                {isMcq && q.options && q.options.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 rounded bg-gray-50 p-3 text-sm">
                    {q.options.map((opt, i) => (
                      <div
                        key={i}
                        className="text-gray-700 font-medium"
                        dangerouslySetInnerHTML={{ __html: formatScientificText(opt) }}
                      />
                    ))}
                  </div>
                )}

                {/* Answer Key */}
                {q.answerKey && (
                  <div className="mt-3 rounded bg-green-50 p-3 text-sm">
                    <p className="font-semibold text-green-900">Answer Key / Solution Guidance:</p>
                    <p
                      className="mt-1 text-green-800"
                      dangerouslySetInnerHTML={{ __html: formatScientificText(q.answerKey) }}
                    />
                  </div>
                )}

                {/* RAG Context */}
                {showSources && (
                  <div className="mt-3 border-t pt-3 text-xs text-gray-600">
                    <p className="font-medium text-gray-900">ℹ️ RAG Curriculum Context Source:</p>
                    <p className="mt-1 italic">
                      Grounding: {q.chapter?.name || 'Curriculum Textbook & Knowledge Base'}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="card text-center py-8 text-gray-600">
            No questions found in this question paper.
          </div>
        )}
      </div>

      {/* Teacher Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-lg font-bold text-gray-900">Edit Question Details</h3>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuestionEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Question Text
                </label>
                <textarea
                  rows={3}
                  value={editFormData.questionText}
                  onChange={(e) => setEditFormData({ ...editFormData, questionText: e.target.value })}
                  required
                  className="input-field w-full font-medium"
                />
              </div>

              {/* Options for MCQ */}
              {((editingQuestion.options && editingQuestion.options.length > 0) || editingQuestion.questionType === 'MCQ' || editingQuestion.type === 'MCQ') && (
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-2">
                    MCQ Choices (A, B, C, D)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {['A', 'B', 'C', 'D'].map((prefix, idx) => (
                      <div key={prefix} className="flex items-center gap-2">
                        <span className="font-bold text-gray-700 w-6 text-sm">{prefix})</span>
                        <input
                          type="text"
                          value={editFormData.options[idx] || ''}
                          onChange={(e) => handleEditOptionChange(idx, e.target.value)}
                          placeholder={`Option ${prefix}`}
                          className="input-field flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Answer Key / Expected Solution
                </label>
                <textarea
                  rows={2}
                  value={editFormData.answerKey}
                  onChange={(e) => setEditFormData({ ...editFormData, answerKey: e.target.value })}
                  className="input-field w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Marks
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={editFormData.marks}
                    onChange={(e) => setEditFormData({ ...editFormData, marks: e.target.value })}
                    required
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={editFormData.difficulty}
                    onChange={(e) => setEditFormData({ ...editFormData, difficulty: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  disabled={updateQuestionMutation.isPending}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateQuestionMutation.isPending}
                  className="btn-primary"
                >
                  {updateQuestionMutation.isPending ? 'Saving Changes...' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
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
