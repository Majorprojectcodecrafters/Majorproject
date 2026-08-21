import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateQPSchema, saveQPSchema } from '../lib/schemas';
import apiClient from '../lib/api';
import { useToast } from '../contexts/ToastContext';

export default function QPGeneratorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [step, setStep] = useState(1); // Step 1: Form, Step 2: Review, Step 3: Generated
  const [generatedData, setGeneratedData] = useState(null);
  const [generating, setGenerating] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(generateQPSchema),
    defaultValues: {
      difficulty: 'MEDIUM',
      totalMarks: 50,
      durationMins: 60,
      mcqCount: 5,
      shortCount: 3,
      longCount: 2,
    },
  });

  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await apiClient.get('/teacher/subjects');
      return response.data.data || [];
    },
  });

  // Fetch chapters for selected subject
  const selectedSubject = watch('subjectId');
  const { data: chapters = [] } = useQuery({
    queryKey: ['chapters', selectedSubject],
    queryFn: async () => {
      if (!selectedSubject) return [];
      const response = await apiClient.get(`/teacher/subjects/${selectedSubject}/chapters`);
      return response.data.data || [];
    },
    enabled: !!selectedSubject,
  });

  // Generate QP mutation
  const generateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/rag/generate', data);
      return response.data.data;
    },
  });

  // Save QP mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/rag/save', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionPapers'] });
    },
  });

  const onGenerate = async (data) => {
    setGenerating(true);
    try {
      const result = await generateMutation.mutateAsync(data);
      setGeneratedData(result);
      setStep(2);
    } catch (error) {
      showToast(`Generation failed: ${error.response?.data?.message || error.message}`, 'error');
    }
    setGenerating(false);
  };

  const updateQuestion = (questionIndex, updates) => {
    setGeneratedData((current) => ({
      ...current,
      questions: current.questions.map((question, index) =>
        index === questionIndex ? { ...question, ...updates } : question
      )
    }));
  };

  const removeQuestion = (questionIndex) => {
    setGeneratedData((current) => ({
      ...current,
      questions: current.questions.filter((_, index) => index !== questionIndex)
    }));
  };

  const onSave = async () => {
    if (!generatedData) return;

    const userTitle = watch('title')?.trim();
    const defaultTitle = `${generatedData.subject} - ${new Date().toLocaleDateString()}`;

    const saveData = {
      title: userTitle || defaultTitle,
      subjectId: watch('subjectId'),
      totalMarks: watch('totalMarks'),
      durationMins: watch('durationMins'),
      instructions: watch('instructions'),
      difficulty: watch('difficulty'),
      questions: generatedData.questions.map((q) => ({
        questionText: q.questionText,
        marks: q.marks,
        difficulty: q.difficulty,
        options: q.options,
        answerKey: q.answerKey,
        chapterId: q.chapterId,
      })),
    };

    try {
      await saveMutation.mutateAsync(saveData);
      showToast('Question paper saved successfully');
      navigate('/dashboard');
    } catch (error) {
      showToast(`Save failed: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Generate Question Paper</h1>

      {/* Step 1: Form */}
      {step === 1 && (
        <div className="max-w-2xl">
          <form onSubmit={handleSubmit(onGenerate)} className="card space-y-6">
            {/* Question Paper Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Question Paper Title</label>
              <input
                type="text"
                placeholder="e.g. Physics Mid-Term Examination 2026 / Unit Test 1"
                {...register('title')}
                className="input-field mt-1 w-full"
              />
              <p className="mt-1 text-xs text-gray-500">Optional. Leave blank to auto-generate from subject & date.</p>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject *</label>
              <select {...register('subjectId')} className="input-field mt-1 w-full">
                <option value="">Select a subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              {errors.subjectId && <p className="form-error mt-1">{errors.subjectId.message}</p>}
            </div>

            {/* Chapters */}
            {chapters.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Chapters *</label>
                <div className="mt-2 space-y-2">
                  {chapters.map((chapter) => (
                    <label key={chapter.id} className="flex items-center">
                      <input
                        type="checkbox"
                        value={chapter.id}
                        {...register('chapterIds')}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">{chapter.name}</span>
                    </label>
                  ))}
                </div>
                {errors.chapterIds && (
                  <p className="form-error mt-1">{errors.chapterIds.message}</p>
                )}
              </div>
            )}

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Difficulty</label>
              <select {...register('difficulty')} className="input-field mt-1 w-full">
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            {/* Total Marks */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Marks</label>
              <input
                type="number"
                min="10"
                {...register('totalMarks', { valueAsNumber: true })}
                className="input-field mt-1 w-full"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
              <input
                type="number"
                min="30"
                {...register('durationMins', { valueAsNumber: true })}
                className="input-field mt-1 w-full"
              />
            </div>

            {/* Question Counts */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">MCQ Count</label>
                <input
                  type="number"
                  min="0"
                  {...register('mcqCount', { valueAsNumber: true })}
                  className="input-field mt-1 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Short Answer Count</label>
                <input
                  type="number"
                  min="0"
                  {...register('shortCount', { valueAsNumber: true })}
                  className="input-field mt-1 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Long Answer Count</label>
                <input
                  type="number"
                  min="0"
                  {...register('longCount', { valueAsNumber: true })}
                  className="input-field mt-1 w-full"
                />
              </div>
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Instructions (Optional)</label>
              <textarea
                {...register('instructions')}
                className="input-field mt-1 w-full"
                rows="3"
                placeholder="e.g., Answer all questions..."
              />
            </div>

            <button type="submit" disabled={generating} className="btn-primary w-full">
              {generating ? (
                <>
                  <span className="spinner mr-2"></span>
                  Generating (this may take 10-30 seconds)...
                </>
              ) : (
                'Generate Question Paper'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Edit Generated */}
      {step === 2 && generatedData && (
        <div className="space-y-6">
          <div className="card">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Review Questions</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Edit wording and marks before opening the final preview.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary"
                >
                  Regenerate all
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!generatedData.questions.length}
                  className="btn-primary"
                >
                  Continue to preview
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {generatedData.questions.map((question, index) => (
                <div key={`${question.type}-${index}`} className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-gray-700">
                      {question.type} question {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                  <label className="block text-sm font-medium text-gray-700">
                    Question text
                    <textarea
                      value={question.questionText}
                      onChange={(event) => updateQuestion(index, { questionText: event.target.value })}
                      rows={3}
                      className="input-field mt-1 w-full"
                    />
                  </label>
                  <label className="mt-3 block max-w-xs text-sm font-medium text-gray-700">
                    Marks
                    <input
                      type="number"
                      min="1"
                      value={question.marks}
                      onChange={(event) => updateQuestion(index, { marks: Number(event.target.value) })}
                      className="input-field mt-1 w-full"
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Final Preview */}
      {step === 3 && generatedData && (
        <div className="space-y-6">
          <div className="card">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Generated Question Paper</h2>
              <div className="space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary"
                >
                  Back
                </button>
                <button
                  onClick={onSave}
                  disabled={saveMutation.isPending}
                  className="btn-primary"
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save Paper'}
                </button>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-4 gap-4 rounded-lg bg-gray-50 p-4">
              <div>
                <p className="text-sm text-gray-600">Paper Title</p>
                <p className="font-semibold text-gray-900">{watch('title')?.trim() || `${generatedData.subject} - ${new Date().toLocaleDateString()}`}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Subject</p>
                <p className="font-semibold text-gray-900">{generatedData.subject}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Marks</p>
                <p className="font-semibold text-gray-900">{generatedData.totalMarks}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-semibold text-gray-900">{generatedData.durationMins} mins</p>
              </div>
            </div>

            {/* MCQ Section */}
            {generatedData.questions.filter((q) => q.type === 'MCQ').length > 0 && (
              <div className="mb-8">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Multiple Choice Questions
                </h3>
                <div className="space-y-4">
                  {generatedData.questions
                    .filter((q) => q.type === 'MCQ')
                    .map((q, idx) => (
                      <div key={idx} className="rounded-lg border border-gray-200 p-4">
                        <p className="mb-2 font-medium text-gray-900">
                          {idx + 1}. {q.questionText}
                        </p>
                        <div className="ml-4 space-y-1">
                          {q.options?.map((opt, i) => (
                            <p
                              key={i}
                              className={`text-sm ${
                                opt === q.answerKey ? 'font-semibold text-green-700' : 'text-gray-600'
                              }`}
                            >
                              {opt}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Short Answer Section */}
            {generatedData.questions.filter((q) => q.type === 'SHORT').length > 0 && (
              <div className="mb-8">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Short Answer Questions
                </h3>
                <div className="space-y-4">
                  {generatedData.questions
                    .filter((q) => q.type === 'SHORT')
                    .map((q, idx) => (
                      <div key={idx} className="rounded-lg border border-gray-200 p-4">
                        <p className="font-medium text-gray-900">
                          {idx + 1}. {q.questionText}
                        </p>
                        <p className="mt-2 text-sm text-gray-600">[{q.marks} marks]</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Long Answer Section */}
            {generatedData.questions.filter((q) => q.type === 'LONG').length > 0 && (
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Long Answer Questions
                </h3>
                <div className="space-y-4">
                  {generatedData.questions
                    .filter((q) => q.type === 'LONG')
                    .map((q, idx) => (
                      <div key={idx} className="rounded-lg border border-gray-200 p-4">
                        <p className="font-medium text-gray-900">
                          {idx + 1}. {q.questionText}
                        </p>
                        <p className="mt-2 text-sm text-gray-600">[{q.marks} marks]</p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
