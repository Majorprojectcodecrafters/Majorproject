import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { useToast } from '../contexts/ToastContext';

export default function StudentQuizPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeQuizId, setActiveQuizId] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizResult, setQuizResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Student Quizzes List
  const { data: quizzes = [], isLoading, error } = useQuery({
    queryKey: ['studentQuizzes'],
    queryFn: async () => {
      const res = await apiClient.get('/quiz/student');
      return res.data.data || [];
    }
  });

  // 2. Fetch Active Quiz Details for Taking
  const { data: quizDetail, isLoading: quizDetailLoading } = useQuery({
    queryKey: ['studentQuizDetail', activeQuizId],
    queryFn: async () => {
      if (!activeQuizId) return null;
      const res = await apiClient.get(`/quiz/student/${activeQuizId}`);
      return res.data.data || null;
    },
    enabled: !!activeQuizId
  });

  // Timer Countdown Effect
  useEffect(() => {
    if (!quizDetail || quizDetail.alreadyAttempted || quizResult) return;

    setTimeLeft((quizDetail.durationMins || 15) * 60);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizDetail, quizResult]);

  const handleSelectOption = (questionId, optionIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuizId || submitting || quizResult) return;

    setSubmitting(true);
    try {
      const res = await apiClient.post(`/quiz/student/${activeQuizId}/attempt`, {
        answers: selectedAnswers
      });

      setQuizResult(res.data.data);
      showToast('Quiz submitted and evaluated!', 'success');
      queryClient.invalidateQueries({ queryKey: ['studentQuizzes'] });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit quiz', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Online Quizzes</h1>
        <p className="mt-1 text-sm text-gray-600">
          Take interactive online quizzes published by your class teachers.
        </p>
      </div>

      {/* QUIZ LIST VIEW */}
      {!activeQuizId && (
        <div className="card space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Available Quizzes</h2>

          {isLoading && <p className="py-8 text-center text-gray-500">Loading quizzes...</p>}
          {error && <p className="rounded bg-red-50 p-4 text-red-700">Unable to load quizzes.</p>}

          {!isLoading && !error && quizzes.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No online quizzes available for your class right now.
            </div>
          )}

          {!isLoading && !error && quizzes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map(q => (
                <div key={q.id} className="border rounded-lg p-5 bg-gray-50/50 hover:bg-white transition-all space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="badge badge-info">{q.subject}</span>
                    <span className="text-xs text-gray-500">{q.durationMins} Mins</span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900">{q.title}</h3>
                  <p className="text-xs text-gray-600">
                    Teacher: <strong>{q.teacherName}</strong> | {q.questionCount} Questions ({q.totalMarks} Marks)
                  </p>

                  <div className="pt-2 border-t flex items-center justify-between">
                    {q.attempted ? (
                      <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded">
                        ✓ Attempted ({q.myAttempt?.score} / {q.myAttempt?.totalMarks})
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveQuizId(q.id);
                          setSelectedAnswers({});
                          setQuizResult(null);
                        }}
                        className="btn-primary py-1.5 text-xs"
                      >
                        Start Quiz
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QUIZ PLAYER VIEW */}
      {activeQuizId && quizDetail && (
        <div className="space-y-6">
          {/* Top Bar */}
          <div className="card bg-blue-900 text-white flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <button
                onClick={() => {
                  setActiveQuizId(null);
                  setQuizResult(null);
                }}
                className="text-xs font-semibold text-blue-200 hover:text-white mb-1"
              >
                ← Exit to Quiz List
              </button>
              <h2 className="text-xl font-bold">{quizDetail.title}</h2>
              <p className="text-xs text-blue-200">{quizDetail.subject} • {quizDetail.teacherName}</p>
            </div>

            {!quizResult && !quizDetail.alreadyAttempted && (
              <div className="bg-blue-800 px-4 py-2 rounded-lg text-center border border-blue-700">
                <div className="text-[10px] text-blue-300 uppercase font-semibold">Time Remaining</div>
                <div className="text-xl font-mono font-bold text-amber-300">{formatTimer(timeLeft)}</div>
              </div>
            )}
          </div>

          {/* Already Attempted Alert */}
          {quizDetail.alreadyAttempted && !quizResult && (
            <div className="card bg-amber-50 border-amber-200 text-amber-900 space-y-2">
              <h3 className="font-bold text-lg">Already Attempted</h3>
              <p className="text-sm">You have already submitted this quiz.</p>
              <div className="text-base font-bold text-purple-900">
                Your Score: {quizDetail.attempt?.score} / {quizDetail.attempt?.totalMarks}
              </div>
            </div>
          )}

          {/* Quiz Result Feedback Screen */}
          {quizResult && (
            <div className="card border-2 border-purple-500 space-y-6">
              <div className="text-center py-6 bg-purple-50 rounded-lg border border-purple-200 space-y-2">
                <h3 className="text-2xl font-bold text-purple-950">Quiz Results Summary</h3>
                <div className="text-4xl font-extrabold text-purple-700">
                  {quizResult.score} / {quizResult.totalMarks}
                </div>
                <p className="text-sm font-semibold text-purple-900">
                  Percentage: {quizResult.percentage}% | Status: {' '}
                  <span className={`px-3 py-1 rounded text-xs font-bold ${quizResult.isPassed ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'}`}>
                    {quizResult.isPassed ? 'PASSED' : 'FAILED'}
                  </span>
                </p>
              </div>

              {/* Question Answers Review */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-900 uppercase">Question Review & Explanations</h4>

                {quizResult.details?.map((q, idx) => (
                  <div key={q.questionId || idx} className={`p-4 rounded-lg border space-y-2 ${q.isCorrect ? 'bg-green-50/50 border-green-300' : 'bg-red-50/50 border-red-300'}`}>
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-gray-900 text-sm">
                        Q{idx + 1}. {q.questionText}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${q.isCorrect ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'}`}>
                        {q.isCorrect ? '✓ Correct (+1)' : '✕ Incorrect (0)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pl-2">
                      {q.options?.map((opt, oIdx) => {
                        const isChosen = q.selectedIndex === oIdx;
                        const isCorrectChoice = q.correctOption === oIdx;
                        return (
                          <div
                            key={oIdx}
                            className={`p-2 rounded border ${
                              isCorrectChoice
                                ? 'bg-green-200 border-green-500 font-bold text-green-950'
                                : isChosen
                                ? 'bg-red-200 border-red-500 font-bold text-red-950'
                                : 'bg-white'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}) {opt}
                            {isCorrectChoice && ' ✓ (Correct Answer)'}
                            {isChosen && !isCorrectChoice && ' ✕ (Your Answer)'}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <p className="text-xs text-gray-700 italic border-t pt-2">
                        <strong>Explanation:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Quiz Taking Form */}
          {!quizResult && !quizDetail.alreadyAttempted && (
            <div className="space-y-6">
              {quizDetail.questions?.map((q, idx) => (
                <div key={q.id} className="card space-y-3">
                  <div className="font-bold text-gray-900 text-base">
                    Q{idx + 1}. {q.questionText}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                    {q.options?.map((opt, oIdx) => {
                      const isSelected = selectedAnswers[q.id] === oIdx;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handleSelectOption(q.id, oIdx)}
                          className={`p-3 rounded-lg border-2 text-left text-sm transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 font-bold text-blue-900 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 bg-white text-gray-800'
                          }`}
                        >
                          <span className="inline-block w-6 font-bold text-blue-700">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSubmitQuiz}
                  disabled={submitting}
                  className="btn-primary min-w-48 text-base py-3"
                >
                  {submitting ? 'Evaluating...' : 'Submit Quiz'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
