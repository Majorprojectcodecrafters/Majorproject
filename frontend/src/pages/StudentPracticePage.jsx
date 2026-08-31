import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { useToast } from '../contexts/ToastContext';

const cleanOptionText = (text) => {
  if (typeof text !== 'string') return String(text || '');
  return text.trim().replace(/^[\(\[]?[a-dA-D1-4][\)\.\:\-]\s*/, '').trim();
};

export default function StudentPracticePage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('arena'); // 'arena' | 'challenges' | 'leaderboard' | 'heatmap'

  // Arena Config
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [inQuiz, setInQuiz] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Player State
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [questionTimes, setQuestionTimes] = useState({});
  const [revealedQuestions, setRevealedQuestions] = useState({});
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [practiceResult, setPracticeResult] = useState(null);

  // Challenge Modal State
  const [challengeOpponentId, setChallengeOpponentId] = useState('');
  const [challengeSubjectId, setChallengeSubjectId] = useState('');
  const [challengeChapterId, setChallengeChapterId] = useState('');
  const [activeChallengeToPlay, setActiveChallengeToPlay] = useState(null);

  // 1. Fetch Subjects & Chapters
  const { data: subjects = [] } = useQuery({
    queryKey: ['practiceSubjects'],
    queryFn: async () => {
      const res = await apiClient.get('/practice/subjects');
      return res.data.data || [];
    }
  });

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
  const availableChapters = selectedSubject?.chapters || [];

  // 2. Fetch Progress & Leaderboard
  const { data: progressData, refetch: refetchProgress } = useQuery({
    queryKey: ['practiceProgress'],
    queryFn: async () => {
      const res = await apiClient.get('/practice/progress');
      return res.data.data || null;
    }
  });

  // 3. Fetch Student Challenges
  const { data: challenges = [], refetch: refetchChallenges } = useQuery({
    queryKey: ['studentChallenges'],
    queryFn: async () => {
      const res = await apiClient.get('/practice/challenges');
      return res.data.data || [];
    }
  });

  // Quiz Timer Countdown Effect
  useEffect(() => {
    if (!inQuiz || practiceResult || !quizData) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishPractice();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [inQuiz, practiceResult, quizData]);

  const handleStartPractice = async () => {
    if (!selectedSubjectId || !selectedChapterId) {
      showToast('Please select a Subject and Chapter', 'error');
      return;
    }

    try {
      const res = await apiClient.post('/practice/generate', {
        subjectId: selectedSubjectId,
        chapterId: selectedChapterId,
        questionCount: Number(questionCount)
      });

      const data = res.data.data;
      setQuizData(data);
      setInQuiz(true);
      setCurrentIdx(0);
      setSelectedAnswers({});
      setQuestionTimes({});
      setRevealedQuestions({});
      setStreak(0);
      setMaxStreak(0);
      setPracticeResult(null);
      setTimeLeft(Math.round((data.durationMins || 13) * 60));
      setQuestionStartTime(Date.now());
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to start practice session', 'error');
    }
  };

  const handleOptionSelect = (qId, optionIdx) => {
    if (revealedQuestions[qId]) return; // Already submitted answer for this question

    const elapsed = Math.round((Date.now() - questionStartTime) / 1000);
    setQuestionTimes(prev => ({ ...prev, [qId]: elapsed }));
    setSelectedAnswers(prev => ({ ...prev, [qId]: optionIdx }));
    setRevealedQuestions(prev => ({ ...prev, [qId]: true }));

    // Instant streak update feedback
    const qObj = quizData.rawQuestions.find(q => q.id === qId);
    if (qObj && optionIdx === qObj.correctOption) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      if (nextStreak > maxStreak) setMaxStreak(nextStreak);
    } else {
      setStreak(0);
    }
  };

  const handleNextQuestion = () => {
    if (currentIdx < quizData.questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setQuestionStartTime(Date.now());
    }
  };

  const handleFinishPractice = async () => {
    if (submitting || practiceResult) return;

    setSubmitting(true);
    const totalTimeTaken = Math.round((quizData.durationMins * 60) - timeLeft);

    try {
      const res = await apiClient.post('/practice/submit', {
        subjectId: selectedSubjectId,
        chapterId: selectedChapterId,
        timeTakenSeconds: totalTimeTaken > 0 ? totalTimeTaken : 10,
        answers: selectedAnswers,
        questionTimes,
        rawQuestions: quizData.rawQuestions
      });

      setPracticeResult(res.data.data);
      showToast('Practice session complete!', 'success');
      refetchProgress();
      queryClient.invalidateQueries({ queryKey: ['practiceProgress'] });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit practice result', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    if (!challengeOpponentId || !challengeSubjectId || !challengeChapterId) {
      showToast('Please select Classmate, Subject, and Chapter', 'error');
      return;
    }

    try {
      await apiClient.post('/practice/challenge', {
        opponentStudentId: challengeOpponentId,
        subjectId: challengeSubjectId,
        chapterId: challengeChapterId,
        questionCount: 10
      });
      showToast('Challenge sent to classmate!', 'success');
      refetchChallenges();
      setChallengeOpponentId('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send challenge', 'error');
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Header & Overall Stats Bar */}
      <div className="border-b pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-info bg-purple-100 text-purple-900 border-purple-300 font-bold">
              MHT-CET STANDARD
            </span>
            <span className="text-xs font-bold text-gray-500">Practice Arena</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-1">Gamified MHT-CET Practice</h1>
        </div>

        {progressData?.stats && (
          <div className="flex items-center gap-4 bg-purple-900 text-white p-3 rounded-xl shadow">
            <div className="text-center px-2">
              <div className="text-[10px] text-purple-300 uppercase font-bold">Level</div>
              <div className="text-xl font-black text-amber-300">Lvl {progressData.stats.level}</div>
            </div>
            <div className="h-8 w-px bg-purple-700"></div>
            <div className="text-center px-2">
              <div className="text-[10px] text-purple-300 uppercase font-bold">Total XP</div>
              <div className="text-xl font-black text-emerald-300">{progressData.stats.totalXp} XP</div>
            </div>
            <div className="h-8 w-px bg-purple-700"></div>
            <div className="text-center px-2">
              <div className="text-[10px] text-purple-300 uppercase font-bold">Avg Accuracy</div>
              <div className="text-xl font-black text-white">{progressData.stats.avgAccuracy}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        <button
          onClick={() => { setActiveTab('arena'); setInQuiz(false); setPracticeResult(null); }}
          className={`btn-sm font-bold ${activeTab === 'arena' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Practice Arena
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          className={`btn-sm font-bold ${activeTab === 'challenges' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Classmate Challenges ({challenges.filter(c => c.status === 'PENDING').length})
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`btn-sm font-bold ${activeTab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Class Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('heatmap')}
          className={`btn-sm font-bold ${activeTab === 'heatmap' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Chapter Mastery Heatmap
        </button>
      </div>

      {/* ==================== TAB 1: PRACTICE ARENA ==================== */}
      {activeTab === 'arena' && !inQuiz && (
        <div className="space-y-8 max-w-3xl mx-auto">
          <div className="card space-y-6 border-2 border-blue-500 shadow-md">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Start Chapterwise Practice Session</h2>

            <div className="space-y-4">
              <div>
                <label className="input-label">Select Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    setSelectedChapterId('');
                  }}
                  className="input-field"
                >
                  <option value="">-- Choose Subject --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">Select Chapter</label>
                <select
                  value={selectedChapterId}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  className="input-field"
                  disabled={!selectedSubjectId}
                >
                  <option value="">-- Choose Chapter --</option>
                  {availableChapters.map(c => (
                    <option key={c.id} value={c.id}>Ch {c.chapterNo || ''}: {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">Select Number of Questions</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  className="input-field"
                >
                  <option value="5">5 MCQs (~6.5 Mins)</option>
                  <option value="10">10 MCQs (~13.0 Mins)</option>
                  <option value="15">15 MCQs (~19.5 Mins)</option>
                  <option value="20">20 MCQs (~26.0 Mins)</option>
                </select>
              </div>
            </div>

            {/* MHT-CET XP Rules Card */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 text-xs space-y-2 text-purple-950">
              <div className="font-bold text-purple-900 text-sm">MHT-CET Gamification Rewards Engine:</div>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Base XP:</strong> 10 XP per correct MHT-CET question.</li>
                <li><strong>Streak Multiplier:</strong> 3 consecutive correct → 1.5× XP (15 XP/q); 5 consecutive correct → 2.0× XP (20 XP/q).</li>
                <li><strong>Speed Bonus:</strong> +5 XP bonus if question is answered in under 15 seconds.</li>
                <li><strong>Retakes:</strong> Unlimited chapter practice retakes with randomized questions.</li>
              </ul>
            </div>

            <button
              onClick={handleStartPractice}
              disabled={!selectedSubjectId || !selectedChapterId}
              className="btn-primary w-full text-lg py-3"
            >
              Launch Practice Quiz
            </button>
          </div>
        </div>
      )}

      {/* ==================== ACTIVE QUIZ PLAYER ==================== */}
      {inQuiz && quizData && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Top Timer & Streak Status */}
          <div className="card bg-purple-950 text-white flex flex-wrap items-center justify-between gap-4 p-4 shadow-lg">
            <div>
              <div className="text-xs text-purple-300">{quizData.subjectName} • {quizData.chapterName}</div>
              <h2 className="text-lg font-bold">Question {currentIdx + 1} of {quizData.questions.length}</h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-purple-900 px-3 py-1.5 rounded-lg border border-purple-700 text-center">
                <div className="text-[10px] text-purple-300 uppercase font-bold">Streak</div>
                <div className="text-lg font-black text-amber-300">{streak} {streak >= 5 ? '(2.0x XP)' : streak >= 3 ? '(1.5x XP)' : ''}</div>
              </div>

              {!practiceResult && (
                <div className="bg-purple-900 px-4 py-1.5 rounded-lg border border-purple-700 text-center">
                  <div className="text-[10px] text-purple-300 uppercase font-bold">Time Left</div>
                  <div className="text-lg font-mono font-bold text-amber-300">{formatTimer(timeLeft)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Result Summary Screen */}
          {practiceResult && (
            <div className="card border-4 border-purple-600 space-y-6 text-center py-8">
              <span className="text-5xl">{practiceResult.badge ? '' : ''}</span>
              <h3 className="text-3xl font-black text-purple-950">Practice Complete!</h3>

              {practiceResult.badge && (
                <div className="inline-block bg-amber-100 border border-amber-300 text-amber-900 px-4 py-1.5 rounded-full font-bold text-sm">
                  {practiceResult.badge}
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center max-w-2xl mx-auto">
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-xs text-purple-700 uppercase font-bold">Score</div>
                  <div className="text-2xl font-black text-purple-900">{practiceResult.correctAnswers} / {practiceResult.totalQuestions}</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="text-xs text-emerald-700 uppercase font-bold">Accuracy</div>
                  <div className="text-2xl font-black text-emerald-900">{practiceResult.accuracy}%</div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="text-xs text-amber-700 uppercase font-bold">Total XP Earned</div>
                  <div className="text-2xl font-black text-amber-900">+{practiceResult.xpBreakdown?.totalXp} XP</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-xs text-blue-700 uppercase font-bold">Max Streak</div>
                  <div className="text-2xl font-black text-blue-900">{practiceResult.maxStreak}</div>
                </div>
              </div>

              {/* Question Breakdown Review */}
              <div className="text-left space-y-4 pt-4 border-t max-h-96 overflow-y-auto pr-2">
                <h4 className="font-bold text-gray-900 uppercase text-sm">Detailed Question Review</h4>

                {practiceResult.questionResults?.map((q, idx) => (
                  <div key={q.id || idx} className={`p-4 rounded-lg border space-y-2 ${q.isCorrect ? 'bg-green-50/60 border-green-300' : 'bg-red-50/60 border-red-300'}`}>
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-gray-900 text-sm">Q{idx + 1}. {q.questionText}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${q.isCorrect ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'}`}>
                        {q.isCorrect ? '✓ Correct' : '✕ Incorrect'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pl-2">
                      {q.options?.map((opt, oIdx) => {
                        const isChosen = q.selectedIndex === oIdx;
                        const isCorrectChoice = q.correctOption === oIdx;
                        return (
                          <div
                            key={oIdx}
                            className={`p-2 rounded border ${isCorrectChoice ? 'bg-green-200 border-green-500 font-bold text-green-950' : isChosen ? 'bg-red-200 border-red-500 font-bold text-red-950' : 'bg-white'}`}
                          >
                            {String.fromCharCode(65 + oIdx)}) {cleanOptionText(opt)} {isCorrectChoice && ' ✓'}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <p className="text-xs text-gray-700 italic border-t pt-1"><strong>Solution:</strong> {q.explanation}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-center gap-4 pt-4">
                <button
                  onClick={() => { setInQuiz(false); setPracticeResult(null); }}
                  className="btn-primary"
                >
                  Return to Practice Arena
                </button>
              </div>
            </div>
          )}

          {/* Interactive Question Card */}
          {!practiceResult && quizData.questions[currentIdx] && (
            <div className="card space-y-6">
              <div className="font-bold text-gray-900 text-lg">
                Q{currentIdx + 1}. {quizData.questions[currentIdx].questionText}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quizData.questions[currentIdx].options?.map((opt, oIdx) => {
                  const qId = quizData.questions[currentIdx].id;
                  const isSelected = selectedAnswers[qId] === oIdx;
                  const isRevealed = revealedQuestions[qId];
                  const rawQ = quizData.rawQuestions.find(q => q.id === qId);
                  const isCorrectChoice = rawQ && rawQ.correctOption === oIdx;

                  let styleClass = 'border-gray-200 hover:border-gray-400 bg-white text-gray-800';
                  if (isRevealed) {
                    if (isCorrectChoice) styleClass = 'border-green-500 bg-green-100 font-bold text-green-950';
                    else if (isSelected) styleClass = 'border-red-500 bg-red-100 font-bold text-red-950';
                  } else if (isSelected) {
                    styleClass = 'border-blue-600 bg-blue-50 font-bold text-blue-900';
                  }

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      disabled={isRevealed}
                      onClick={() => handleOptionSelect(qId, oIdx)}
                      className={`p-4 rounded-xl border-2 text-left text-sm transition-all ${styleClass}`}
                    >
                      <span className="font-bold text-purple-700 mr-2">{String.fromCharCode(65 + oIdx)}.</span> {cleanOptionText(opt)}
                    </button>
                  );
                })}
              </div>

              {/* Instant Solution Explanation Display */}
              {revealedQuestions[quizData.questions[currentIdx].id] && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-1">
                  <div className="font-bold text-blue-900">Solution Explanation:</div>
                  <p>{quizData.rawQuestions.find(q => q.id === quizData.questions[currentIdx].id)?.explanation}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <button
                  onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                  disabled={currentIdx === 0}
                  className="btn-secondary py-2"
                >
                  ← Previous
                </button>

                {currentIdx < quizData.questions.length - 1 ? (
                  <button onClick={handleNextQuestion} className="btn-primary py-2">
                    Next Question →
                  </button>
                ) : (
                  <button onClick={handleFinishPractice} disabled={submitting} className="btn-primary bg-emerald-600 hover:bg-emerald-700 py-2">
                    {submitting ? 'Evaluating...' : 'Finish & Calculate XP'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 2: CLASSMATE CHALLENGES ==================== */}
      {activeTab === 'challenges' && (
        <div className="space-y-8">
          <form onSubmit={handleCreateChallenge} className="card bg-purple-50/50 border border-purple-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-purple-950 uppercase tracking-wider">
              Invite Classmate to Practice Challenge
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="input-label">Select Classmate</label>
                <select
                  value={challengeOpponentId}
                  onChange={(e) => setChallengeOpponentId(e.target.value)}
                  className="input-field bg-white"
                  required
                >
                  <option value="">Choose Classmate</option>
                  {progressData?.classmates?.map(cm => (
                    <option key={cm.studentId} value={cm.studentId}>
                      {cm.name} ({cm.uniqueId}) — Level {cm.level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">Select Subject</label>
                <select
                  value={challengeSubjectId}
                  onChange={(e) => {
                    setChallengeSubjectId(e.target.value);
                    setChallengeChapterId('');
                  }}
                  className="input-field bg-white"
                  required
                >
                  <option value="">Choose Subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">Select Chapter</label>
                <select
                  value={challengeChapterId}
                  onChange={(e) => setChallengeChapterId(e.target.value)}
                  className="input-field bg-white"
                  disabled={!challengeSubjectId}
                  required
                >
                  <option value="">Choose Chapter</option>
                  {(subjects.find(s => s.id === challengeSubjectId)?.chapters || []).map(c => (
                    <option key={c.id} value={c.id}>Ch {c.chapterNo || ''}: {c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary">
              Send Challenge
            </button>
          </form>

          {/* Active Challenges Feed */}
          <div className="card space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Classmate Challenges Log</h3>

            {challenges.length === 0 ? (
              <p className="py-6 text-center text-gray-500">No active challenges yet. Challenge a classmate above!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-700 uppercase">
                      <th className="p-3">Challenger</th>
                      <th className="p-3">Opponent</th>
                      <th className="p-3">Subject & Chapter</th>
                      <th className="p-3">Scores</th>
                      <th className="p-3">Status / Winner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {challenges.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="p-3 font-semibold text-gray-900">{c.challenger?.user?.name}</td>
                        <td className="p-3 font-semibold text-gray-900">{c.opponent?.user?.name}</td>
                        <td className="p-3 text-xs">{c.subject?.name} • {c.chapter?.name}</td>
                        <td className="p-3 text-xs font-mono">
                          {c.challengerScore !== null ? `${c.challengerScore} pts` : 'Pending'} vs {c.opponentScore !== null ? `${c.opponentScore} pts` : 'Pending'}
                        </td>
                        <td className="p-3">
                          <span className={`badge ${c.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: CLASS LEADERBOARD ==================== */}
      {activeTab === 'leaderboard' && progressData?.leaderboard && (
        <div className="card space-y-6 max-w-3xl mx-auto border-t-4 border-amber-500">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-xl font-bold text-gray-900">Class Leaderboard</h2>
            <span className="text-xs text-gray-500 font-semibold">Ranked by Total XP in Class</span>
          </div>

          <div className="space-y-3">
            {progressData.leaderboard.map((student, idx) => (
              <div
                key={student.studentId}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${student.isMe ? 'bg-purple-50 border-purple-400 font-bold shadow-sm' : 'bg-gray-50/50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-slate-300 text-gray-800' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    {idx + 1}
                  </div>

                  <div>
                    <div className="text-base text-gray-900">{student.name} {student.isMe && '(You)'}</div>
                    <div className="text-xs text-gray-500">ID: {student.uniqueId} | Level {student.level}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-purple-700">{student.totalXp} XP</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: CHAPTER MASTERY HEATMAP ==================== */}
      {activeTab === 'heatmap' && progressData?.chapterMastery && (
        <div className="card space-y-6">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Chapterwise Mastery Heatmap</h2>
              <p className="text-xs text-gray-500">Mastered (&gt;80%), Intermediate (50-80%), Needs Practice (&lt;50%)</p>
            </div>
          </div>

          {progressData.chapterMastery.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No practice sessions completed yet to build mastery heatmap.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {progressData.chapterMastery.map(c => (
                <div
                  key={c.chapterId}
                  className={`p-4 rounded-xl border-l-4 space-y-2 ${c.status === 'Mastered' ? 'border-green-500 bg-green-50/50' : c.status === 'Intermediate' ? 'border-amber-500 bg-amber-50/50' : 'border-red-500 bg-red-50/50'}`}
                >
                  <div className="text-xs text-gray-500 uppercase font-bold">{c.subjectName}</div>
                  <div className="text-base font-bold text-gray-900">{c.chapterName}</div>
                  <div className="flex justify-between items-center text-xs pt-2 border-t">
                    <span className="font-bold text-gray-700">Accuracy: {c.accuracy}%</span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${c.status === 'Mastered' ? 'bg-green-200 text-green-900' : c.status === 'Intermediate' ? 'bg-amber-200 text-amber-900' : 'bg-red-200 text-red-900'}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
