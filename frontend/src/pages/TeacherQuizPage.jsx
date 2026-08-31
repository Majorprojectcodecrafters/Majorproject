import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function TeacherQuizPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('builder'); // 'builder' | 'list'
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedChapterIds, setSelectedChapterIds] = useState([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [durationMins, setDurationMins] = useState(15);
  const [quizTitle, setQuizTitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [selectedQuizDetail, setSelectedQuizDetail] = useState(null);

  // 1. Fetch Teacher Assigned Classes & Subjects
  const { data: assignedClasses = [] } = useQuery({
    queryKey: ['teacherAssignedClassesQuiz'],
    queryFn: async () => {
      const res = await apiClient.get('/teacher/assigned-classes');
      return res.data.data || [];
    }
  });

  // 2. Fetch Subjects for Selected Class
  const { data: subjects = [] } = useQuery({
    queryKey: ['teacherSubjectsQuiz'],
    queryFn: async () => {
      const res = await apiClient.get('/teacher/subjects');
      return res.data.data || [];
    }
  });

  // 3. Fetch Chapters for Selected Subject
  const { data: chapters = [] } = useQuery({
    queryKey: ['teacherChaptersQuiz', selectedSubjectId],
    queryFn: async () => {
      if (!selectedSubjectId) return [];
      const res = await apiClient.get(`/teacher/subjects/${selectedSubjectId}/chapters`);
      return res.data.data || [];
    },
    enabled: !!selectedSubjectId
  });

  // 4. Fetch Teacher's Generated Quizzes
  const { data: quizzes = [], refetch: refetchQuizzes } = useQuery({
    queryKey: ['teacherQuizzes'],
    queryFn: async () => {
      const res = await apiClient.get('/quiz/teacher');
      return res.data.data || [];
    }
  });

  const toggleChapter = (id) => {
    setSelectedChapterIds(prev =>
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    if (!selectedSubjectId || !selectedClassId || !selectedChapterIds.length) {
      showToast('Please select Subject, Class, and at least 1 Chapter', 'error');
      return;
    }

    setGenerating(true);
    try {
      const res = await apiClient.post('/quiz/generate', {
        title: quizTitle || undefined,
        subjectId: selectedSubjectId,
        classId: selectedClassId,
        chapterIds: selectedChapterIds,
        questionCount: Number(questionCount),
        durationMins: Number(durationMins)
      });

      setGeneratedQuiz(res.data.data);
      showToast('Quiz generated successfully! Review and publish when ready.', 'success');
      refetchQuizzes();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to generate quiz', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublishQuiz = async (quizId) => {
    try {
      await apiClient.post(`/quiz/${quizId}/publish`);
      showToast('Quiz published to assigned class students!', 'success');
      setGeneratedQuiz(prev => prev && prev.id === quizId ? { ...prev, isPublished: true } : prev);
      refetchQuizzes();
      queryClient.invalidateQueries({ queryKey: ['teacherQuizzes'] });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to publish quiz', 'error');
    }
  };

  const handleViewQuizResults = async (quizId) => {
    try {
      const res = await apiClient.get(`/quiz/teacher/${quizId}`);
      setSelectedQuizDetail(res.data.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load quiz details', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('quizManagementTitle', 'Quiz Management System')}</h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            {t('quizManagementSubtitle', 'Generate online objective quizzes using existing curriculum chunks & RAG syllabus mapping.')}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('builder')}
            className={`btn-sm ${activeTab === 'builder' ? 'btn-primary' : 'btn-secondary'}`}
          >
            {t('generateQuizTab', 'Generate Quiz')}
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`btn-sm ${activeTab === 'list' ? 'btn-primary' : 'btn-secondary'}`}
          >
            {t('manageResultsTab', 'Manage & Results')} ({quizzes.length})
          </button>
        </div>
      </div>

      {/* TAB 1: QUIZ BUILDER */}
      {activeTab === 'builder' && (
        <div className="space-y-8">
          <form onSubmit={handleGenerateQuiz} className="card space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">{t('generateNewQuizTitle', 'Generate New Online Quiz')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label font-bold text-xs text-slate-700">{t('quizTitleOptional', 'Quiz Title (Optional)')}</label>
                <input
                  type="text"
                  placeholder={t('quizTitlePlaceholder', 'e.g. Physics Chapter 1 & 2 Online Assessment')}
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  className="input-field mt-1"
                />
              </div>

              <div>
                <label className="input-label font-bold text-xs text-slate-700">{t('targetClassDivision', 'Target Class / Division')}</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="input-field mt-1"
                  required
                >
                  <option value="">{t('selectTargetClass', 'Select Target Class')}</option>
                  {assignedClasses.map(ac => (
                    <option key={ac.class?.id} value={ac.class?.id}>
                      {ac.class?.name} ({ac.subject?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label font-bold text-xs text-slate-700">{t('subject', 'Subject')}</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    setSelectedChapterIds([]);
                  }}
                  className="input-field mt-1"
                  required
                >
                  <option value="">{t('selectSubjectOption', 'Select Subject')}</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label font-bold text-xs text-slate-700">{t('questionsLabel', 'Questions')}</label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(e.target.value)}
                    className="input-field mt-1"
                  >
                    <option value="5">5 MCQs (5 Marks)</option>
                    <option value="10">10 MCQs (10 Marks)</option>
                    <option value="15">15 MCQs (15 Marks)</option>
                    <option value="20">20 MCQs (20 Marks)</option>
                  </select>
                </div>

                <div>
                  <label className="input-label font-bold text-xs text-slate-700">{t('timeLimitLabel', 'Time Limit')}</label>
                  <select
                    value={durationMins}
                    onChange={(e) => setDurationMins(e.target.value)}
                    className="input-field mt-1"
                  >
                    <option value="10">10 Mins</option>
                    <option value="15">15 Mins</option>
                    <option value="30">30 Mins</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Chapter Selection */}
            {selectedSubjectId && (
              <div>
                <label className="input-label mb-2 block font-bold text-xs text-slate-700">
                  {t('selectChaptersToInclude', 'Select Chapters to Include')} ({selectedChapterIds.length} selected)
                </label>

                {chapters.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 border border-slate-200 rounded-xl bg-slate-50">
                    {chapters.map(c => (
                      <label key={c.id} className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer p-1.5 hover:bg-white rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedChapterIds.includes(c.id)}
                          onChange={() => toggleChapter(c.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span><strong>Ch {c.chapterNo || ''}:</strong> {c.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic font-medium">{t('noChaptersFound', 'No chapters found for selected subject.')}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={generating || !selectedSubjectId || !selectedClassId || !selectedChapterIds.length}
              className="btn-primary min-w-48"
            >
              {generating ? t('generatingQuiz', 'Generating Quiz...') : t('generateQuizBtn', 'Generate Quiz')}
            </button>
          </form>

          {/* Generated Quiz Review */}
          {generatedQuiz && (
            <div className="card border-2 border-blue-500 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <div>
                  <span className="badge badge-info">DRAFT QUIZ PREVIEW</span>
                  <h2 className="text-xl font-bold text-gray-900 mt-1">{generatedQuiz.title}</h2>
                  <p className="text-xs text-gray-600">
                    Subject: {generatedQuiz.subject?.name} | Class: {generatedQuiz.class?.name} | Total Questions: {generatedQuiz.questions?.length} ({generatedQuiz.totalMarks} Marks)
                  </p>
                </div>

                <button
                  onClick={() => handlePublishQuiz(generatedQuiz.id)}
                  disabled={generatedQuiz.isPublished}
                  className="btn-primary bg-green-600 hover:bg-green-700"
                >
                  {generatedQuiz.isPublished ? '✓ Published to Class' : 'Publish Quiz to Class'}
                </button>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {generatedQuiz.questions?.map((q, idx) => (
                  <div key={q.id || idx} className="p-4 rounded-lg bg-gray-50 border space-y-2 text-sm">
                    <div className="font-bold text-gray-900">
                      Q{idx + 1}. {q.questionText}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pl-4">
                      {q.options?.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded border ${oIdx === q.correctOption ? 'bg-green-100 border-green-400 font-bold text-green-900' : 'bg-white'}`}
                        >
                          {String.fromCharCode(65 + oIdx)}) {opt} {oIdx === q.correctOption && '✓ (Correct)'}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANAGED QUIZZES & RESULTS */}
      {activeTab === 'list' && (
        <div className="card space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Created Quizzes</h2>

          {quizzes.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No quizzes generated yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-700 uppercase">
                    <th className="p-3">Quiz Title</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Questions</th>
                    <th className="p-3">Attempts</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {quizzes.map(q => (
                    <tr key={q.id} className="hover:bg-gray-50">
                      <td className="p-3 font-semibold text-gray-900">{q.title}</td>
                      <td className="p-3">{q.subject?.name}</td>
                      <td className="p-3">{q.class?.name}</td>
                      <td className="p-3">{q._count?.questions} MCQs ({q.totalMarks}m)</td>
                      <td className="p-3 font-bold text-blue-700">{q._count?.attempts} Attempts</td>
                      <td className="p-3">
                        <span className={`badge ${q.isPublished ? 'badge-success' : 'badge-warning'}`}>
                          {q.isPublished ? 'PUBLISHED' : 'DRAFT'}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {!q.isPublished && (
                          <button
                            onClick={() => handlePublishQuiz(q.id)}
                            className="btn-secondary py-1 text-xs bg-green-50 text-green-700 border-green-300"
                          >
                            Publish
                          </button>
                        )}
                        <button
                          onClick={() => handleViewQuizResults(q.id)}
                          className="btn-secondary py-1 text-xs"
                        >
                          View Results
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

      {/* Quiz Results Modal */}
      {selectedQuizDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedQuizDetail.title}</h2>
                <p className="text-xs text-gray-500">
                  Subject: {selectedQuizDetail.subject?.name} | Class: {selectedQuizDetail.class?.name}
                </p>
              </div>
              <button onClick={() => setSelectedQuizDetail(null)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase">
                Student Quiz Attempts ({selectedQuizDetail.attempts?.length || 0})
              </h3>

              {selectedQuizDetail.attempts?.length > 0 ? (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b font-semibold text-gray-700">
                      <tr>
                        <th className="p-2">Student Name</th>
                        <th className="p-2">Score</th>
                        <th className="p-2">Percentage</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Submitted Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedQuizDetail.attempts.map(a => {
                        const pct = ((a.score / a.totalMarks) * 100).toFixed(1);
                        return (
                          <tr key={a.id}>
                            <td className="p-2 font-medium text-gray-900">{a.student?.user?.name}</td>
                            <td className="p-2 font-bold text-purple-700">{a.score} / {a.totalMarks}</td>
                            <td className="p-2 font-bold">{pct}%</td>
                            <td className="p-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {a.isPassed ? 'PASS' : 'FAIL'}
                              </span>
                            </td>
                            <td className="p-2 text-gray-500">{new Date(a.submittedAt).toLocaleDateString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic bg-gray-50 p-4 rounded text-center">
                  No students have attempted this quiz yet.
                </p>
              )}
            </div>

            <div className="flex justify-end border-t pt-4">
              <button onClick={() => setSelectedQuizDetail(null)} className="btn-secondary">
                Close Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
