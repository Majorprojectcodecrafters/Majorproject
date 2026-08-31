import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateQPSchema } from '../lib/schemas';
import apiClient from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import CustomPatternBuilder from '../components/CustomPatternBuilder';
import CustomTopicWeightage from '../components/CustomTopicWeightage';
import { formatScientificText } from '../utils/formatScientific';

export default function QPGeneratorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [step, setStep] = useState(1); // 1: Class & Subject, 2: Pattern & Scope, 3: Weightage, 4: Preview/Generate, 5: Review
  const [selectedClassId, setSelectedClassId] = useState('');
  const [patternMode, setPatternMode] = useState('BOARD'); // 'BOARD' | 'CUSTOM'
  const [selectedBoardPattern, setSelectedBoardPattern] = useState(null);
  const [boardPatternLoading, setBoardPatternLoading] = useState(false);
  const [boardPatternError, setBoardPatternError] = useState(null);

  const [customPatternData, setCustomPatternData] = useState(null);
  const [customTopicWeightages, setCustomTopicWeightages] = useState({});
  const [targetTotalMarks, setTargetTotalMarks] = useState(70);
  const [durationMins, setDurationMins] = useState(180);

  const [generatedData, setGeneratedData] = useState(null);
  const [generating, setGenerating] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(generateQPSchema),
    defaultValues: {
      difficulty: 'MEDIUM',
      totalMarks: 70,
      durationMins: 180,
      patternMode: 'BOARD',
      chapterIds: []
    }
  });

  // 1. Fetch Classes (Class-First Cascading)
  const { data: classes = [] } = useQuery({
    queryKey: ['curriculum-classes'],
    queryFn: async () => {
      const res = await apiClient.get('/curriculum/classes');
      return res.data.data || [];
    }
  });

  // Default to 12th Standard if available
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      const cls12 = classes.find(c => c.name.includes('12th'));
      if (cls12) setSelectedClassId(cls12.id);
      else setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  // 2. Fetch Subjects for Selected Class
  const { data: subjects = [] } = useQuery({
    queryKey: ['curriculum-subjects', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      const res = await apiClient.get(`/curriculum/subjects?classId=${selectedClassId}`);
      return res.data.data || [];
    },
    enabled: !!selectedClassId
  });

  const selectedSubjectId = watch('subjectId');
  const selectedSubjectObj = subjects.find(s => s.id === selectedSubjectId);

  // 3. Fetch Chapters & Weightages for Selected Subject
  const { data: chapters = [] } = useQuery({
    queryKey: ['curriculum-chapters', selectedSubjectId],
    queryFn: async () => {
      if (!selectedSubjectId) return [];
      const res = await apiClient.get(`/curriculum/chapters?subjectId=${selectedSubjectId}`);
      return res.data.data || [];
    },
    enabled: !!selectedSubjectId
  });

  const { data: dbWeightages = [] } = useQuery({
    queryKey: ['curriculum-weightage', selectedClassId, selectedSubjectId],
    queryFn: async () => {
      if (!selectedSubjectId) return [];
      const res = await apiClient.get(`/curriculum/weightage?classId=${selectedClassId}&subjectId=${selectedSubjectId}`);
      return res.data.data || [];
    },
    enabled: !!selectedSubjectId
  });

  // 4. Fetch Saved Custom Patterns
  const { data: savedCustomPatterns = [], refetch: refetchSavedPatterns } = useQuery({
    queryKey: ['custom-patterns'],
    queryFn: async () => {
      const res = await apiClient.get('/patterns/custom');
      return res.data.data || [];
    }
  });

  // Auto-initialize chapterIds ONLY when subject changes
  const currentChapterIds = watch('chapterIds');
  useEffect(() => {
    if (selectedSubjectId && chapters.length > 0) {
      setValue('chapterIds', chapters.map(c => c.id));
    }
  }, [selectedSubjectId, chapters.length]);

  // Auto-load Board Pattern when subject is selected & mode is BOARD
  useEffect(() => {
    if (selectedSubjectObj && patternMode === 'BOARD') {
      setBoardPatternLoading(true);
      setBoardPatternError(null);

      apiClient.get(`/patterns/board/${encodeURIComponent(selectedSubjectObj.name)}`)
        .then(res => {
          setSelectedBoardPattern(res.data.data);
          setTargetTotalMarks(res.data.data.totalMarks);
          setDurationMins(res.data.data.durationMins);
          setValue('totalMarks', res.data.data.totalMarks);
          setValue('durationMins', res.data.data.durationMins);
        })
        .catch(err => {
          setSelectedBoardPattern(null);
          setBoardPatternError(err.response?.data?.message || 'Board pattern unavailable for this subject');
        })
        .finally(() => {
          setBoardPatternLoading(false);
        });
    }
  }, [selectedSubjectObj, patternMode, setValue]);

  // Generate QP mutation
  const generateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/rag/generate', data);
      return response.data.data;
    }
  });

  // Save QP mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/rag/save', data);
      return response.data.data;
    }
  });

  const onSubmitForm = async (formData) => {
    if (!selectedClassId) {
      showToast('Please select a class first', 'error');
      return;
    }

    if (patternMode === 'CUSTOM' && !customPatternData) {
      showToast('Please build and save your custom pattern structure', 'error');
      return;
    }

    try {
      setGenerating(true);

      const payload = {
        classId: selectedClassId,
        subjectId: formData.subjectId,
        chapterIds: formData.chapterIds && formData.chapterIds.length ? formData.chapterIds : chapters.map(c => c.id),
        difficulty: formData.difficulty,
        totalMarks: targetTotalMarks,
        durationMins,
        instructions: formData.instructions,
        patternMode,
        patternData: patternMode === 'BOARD' ? selectedBoardPattern : customPatternData,
        customTopicWeightages: patternMode === 'CUSTOM' ? customTopicWeightages : null
      };

      const result = await generateMutation.mutateAsync(payload);
      setGeneratedData(result);
      setStep(5); // Move to review step
    } catch (err) {
      const errData = err.response?.data;
      const mainMsg = errData?.message || errData?.error || 'Failed to generate question paper';
      const reasonTag = errData?.reason ? `[${errData.reason}] ` : '';
      const suggestion = errData?.actionableSuggestion ? ` — ${errData.actionableSuggestion}` : '';

      showToast(`${reasonTag}${mainMsg}${suggestion}`, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleSavePaper = async () => {
    if (!generatedData) return;

    try {
      const titleInput = watch('title');
      const payload = {
        title: titleInput || `${generatedData.subject} ${generatedData.patternMode === 'BOARD' ? 'Board' : 'Custom'} Exam Paper`,
        subjectId: generatedData.subjectId,
        totalMarks: generatedData.totalMarks,
        durationMins: generatedData.durationMins,
        instructions: watch('instructions'),
        difficulty: generatedData.difficulty,
        patternMode: generatedData.patternMode,
        board: generatedData.board,
        patternVersion: generatedData.patternVersion,
        patternData: generatedData.patternData,
        examDate: watch('examDate'),
        questions: generatedData.questions
      };

      const savedQP = await saveMutation.mutateAsync(payload);
      showToast('Question paper saved cleanly!', 'success');

      // Invalidate queries so dashboard reloads with new paper immediately without manual refresh
      queryClient.invalidateQueries({ queryKey: ['questionPapers'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-question-papers'] });
      queryClient.invalidateQueries({ queryKey: ['paper', savedQP.id] });

      navigate(`/paper/${savedQP.id}`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save question paper', 'error');
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Paper Generator</h1>
          <p className="text-sm text-gray-600">Curriculum-Aware RAG Engine for Board & Custom Paper Patterns</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Step {step} of 5</span>
        </div>
      </div>

      {/* Workflow Progress Steps */}
      <div className="mb-8 grid grid-cols-5 gap-2">
        <div className={`p-2 rounded text-center text-xs font-semibold ${step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
          1. Class & Subject
        </div>
        <div className={`p-2 rounded text-center text-xs font-semibold ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
          2. Paper Pattern
        </div>
        <div className={`p-2 rounded text-center text-xs font-semibold ${step === 3 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
          3. Syllabus & Weightage
        </div>
        <div className={`p-2 rounded text-center text-xs font-semibold ${step === 4 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
          4. Preview Config
        </div>
        <div className={`p-2 rounded text-center text-xs font-semibold ${step === 5 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
          5. Review Questions
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
        {/* ================= STEP 1: CLASS & SUBJECT SELECTION ================= */}
        {step === 1 && (
          <div className="card space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Step 1: Select Academic Scope</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Class Dropdown */}
              <div>
                <label className="label">Academic Class / Standard *</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    setValue('subjectId', '');
                  }}
                  className="input-field"
                >
                  <option value="">-- Select Class --</option>
                  {classes.map((cls) => {
                    const streamName = cls.stream?.name || '';
                    const displayName = streamName && !cls.name.toLowerCase().includes(streamName.toLowerCase())
                      ? `${cls.name} (${streamName})`
                      : cls.name;
                    return (
                      <option key={cls.id} value={cls.id}>
                        {displayName}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-gray-500 mt-1">Selecting class scopes all subjects, chapters, topics, and textbooks.</p>
              </div>

              {/* Subject Dropdown */}
              <div>
                <label className="label">Subject *</label>
                <select
                  {...register('subjectId')}
                  className="input-field"
                  disabled={!selectedClassId}
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                {errors.subjectId && <p className="text-xs text-red-500 mt-1">{errors.subjectId.message}</p>}
              </div>
            </div>

            {/* Paper Title */}
            <div>
              <label className="label">Question Paper Title *</label>
              <input
                type="text"
                {...register('title')}
                placeholder="e.g. HSC 12th Physics Board Practice Examination 2026"
                className="input-field"
              />
            </div>

            <div>
              <label className="input-label">Date of Examination (Customizable)</label>
              <input
                type="date"
                {...register('examDate')}
                className="input-field"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional. If specified, this date will be printed on the paper header and PDF export.
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!selectedClassId || !selectedSubjectId}
                className="btn-primary"
              >
                Next: Select Paper Pattern →
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: PATTERN SELECTION ================= */}
        {step === 2 && (
          <div className="card space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Step 2: Paper Pattern Mode</h2>

            {/* Pattern Mode Selector */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setPatternMode('BOARD');
                  setValue('patternMode', 'BOARD');
                }}
                className={`p-4 rounded-lg border-2 text-left transition-all ${patternMode === 'BOARD' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="font-bold text-gray-900">Official Board Pattern</div>
                <div className="text-xs text-gray-600 mt-1">
                  Automated Maharashtra State Board pattern (Sections A, B, C, D) with prescribed question types and total marks.
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPatternMode('CUSTOM');
                  setValue('patternMode', 'CUSTOM');
                }}
                className={`p-4 rounded-lg border-2 text-left transition-all ${patternMode === 'CUSTOM' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="font-bold text-gray-900">Customized Pattern Builder</div>
                <div className="text-xs text-gray-600 mt-1">
                  Build custom sections, custom total marks, custom question types, or MCQ-only examination papers.
                </div>
              </button>
            </div>

            {/* Board Pattern Display */}
            {patternMode === 'BOARD' && (
              <div className="space-y-4">
                {boardPatternLoading && <p className="text-sm text-gray-500">Loading board pattern structure...</p>}
                {boardPatternError && (
                  <div className="rounded bg-red-50 border border-red-200 p-4 text-xs text-red-700">
                    ⚠️ {boardPatternError}
                  </div>
                )}
                {selectedBoardPattern && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="font-bold text-blue-900">{selectedBoardPattern.board}</span>
                      <span className="text-xs font-semibold text-blue-700">{selectedBoardPattern.totalMarks} Marks | {selectedBoardPattern.durationMins} Minutes</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {selectedBoardPattern.sections?.map((sec, idx) => (
                        <div key={idx} className="bg-white p-3 rounded border border-gray-200 space-y-1">
                          <div className="font-bold text-gray-900">{sec.sectionName} — {sec.totalSectionMarks}m</div>
                          <div className="text-gray-600">{sec.instructions}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Saved Custom Patterns Dropdown / Picker */}
            {patternMode === 'CUSTOM' && savedCustomPatterns.length > 0 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-900">📚 Load from Saved Custom Patterns Library:</label>
                  <span className="text-xs font-semibold text-blue-700">{savedCustomPatterns.length} Saved Pattern(s)</span>
                </div>
                <select
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    if (!selectedId) return;
                    const selected = savedCustomPatterns.find(p => p.id === selectedId);
                    if (selected) {
                      const pData = selected.patternData || { name: selected.name, sections: [], totalMarks: selected.totalMarks, durationMins: selected.durationMins };
                      setCustomPatternData(pData);
                      setTargetTotalMarks(selected.totalMarks);
                      setDurationMins(selected.durationMins);
                      setValue('totalMarks', selected.totalMarks);
                      setValue('durationMins', selected.durationMins);
                      showToast(`Loaded pattern "${selected.name}"!`, 'success');
                    }
                  }}
                  className="input-field text-xs bg-white font-medium text-gray-800"
                >
                  <option value="">-- Select Saved Custom Pattern --</option>
                  {savedCustomPatterns.map((pat) => (
                    <option key={pat.id} value={pat.id}>
                      {pat.name} ({pat.totalMarks} Marks | {pat.durationMins} Mins)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom Pattern Builder */}
            {patternMode === 'CUSTOM' && (
              <CustomPatternBuilder
                initialPattern={customPatternData}
                targetTotalMarks={targetTotalMarks}
                setTargetTotalMarks={setTargetTotalMarks}
                durationMins={durationMins}
                setDurationMins={setDurationMins}
                onSavePattern={(pData) => {
                  setCustomPatternData(pData);
                  setTargetTotalMarks(pData.totalMarks);
                  setDurationMins(pData.durationMins);
                  setValue('totalMarks', pData.totalMarks);
                  setValue('durationMins', pData.durationMins);
                  refetchSavedPatterns();
                }}
              />
            )}

            <div className="flex justify-between pt-4 border-t">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                ← Back to Scope
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={patternMode === 'BOARD' && !selectedBoardPattern}
                className="btn-primary"
              >
                Next: Syllabus & Weightage →
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: SYLLABUS & WEIGHTAGE ================= */}
        {step === 3 && (
          <div className="card space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Step 3: Syllabus Coverage & Weightage</h2>

            {/* Chapter Checkboxes with Persistent User Choice */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="label">Select Syllabus Chapters</label>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setValue('chapterIds', chapters.map(c => c.id))}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => setValue('chapterIds', [])}
                    className="text-gray-500 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-md p-3">
                {chapters.map((ch) => (
                  <label key={ch.id} className="flex items-center gap-2 text-xs text-gray-800 hover:bg-gray-50 p-1 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      value={ch.id}
                      {...register('chapterIds')}
                      className="rounded text-blue-600"
                    />
                    <span>{ch.chapterNo ? `Ch ${ch.chapterNo}: ` : ''}{ch.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Board Weightage vs Custom Topic Weightage Display */}
            {patternMode === 'BOARD' ? (
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-bold text-sm text-gray-900">Authoritative Board Chapter Weightages</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border">
                    <thead className="bg-gray-100 font-bold border-b">
                      <tr>
                        <th className="p-2">Chapter / Unit</th>
                        <th className="p-2 text-center">Marks (Without Option)</th>
                        <th className="p-2 text-center">Marks (With Option)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {dbWeightages.map((w, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-medium">{w.chapter?.name || w.unit?.name || 'General'}</td>
                          <td className="p-2 text-center font-bold text-blue-700">{w.marks}m</td>
                          <td className="p-2 text-center text-gray-600">{w.marksWithOption}m</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <CustomTopicWeightage
                chapters={chapters.filter(c => (currentChapterIds && currentChapterIds.length > 0) ? currentChapterIds.includes(c.id) : true)}
                targetTotalMarks={targetTotalMarks}
                onChange={(tMarks) => setCustomTopicWeightages(tMarks)}
              />
            )}

            <div className="flex justify-between pt-4 border-t">
              <button type="button" onClick={() => setStep(2)} className="btn-secondary">
                ← Back to Pattern
              </button>
              <button type="button" onClick={() => setStep(4)} className="btn-primary">
                Next: Preview Config →
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: PREVIEW CONFIG & GENERATE ================= */}
        {step === 4 && (
          <div className="card space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Step 4: Preview Configuration & Generate</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-gray-50 p-3 rounded border">
                <span className="text-gray-500 block">Class & Subject</span>
                <span className="font-bold text-gray-900">{selectedSubjectObj?.name}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded border">
                <span className="text-gray-500 block">Pattern Mode</span>
                <span className="font-bold text-blue-700">{patternMode === 'BOARD' ? 'Official Board Pattern' : 'Custom Pattern'}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded border">
                <span className="text-gray-500 block">Marks & Duration</span>
                <span className="font-bold text-gray-900">{targetTotalMarks} Marks / {durationMins} Mins</span>
              </div>
            </div>

            {/* Difficulty & Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Difficulty Level</label>
                <select {...register('difficulty')} className="input-field">
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>

              <div>
                <label className="label">Custom Exam Instructions (Optional)</label>
                <input
                  type="text"
                  {...register('instructions')}
                  placeholder="e.g. Use of log tables is allowed. Calculators not permitted."
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <button type="button" onClick={() => setStep(3)} className="btn-secondary">
                ← Back to Syllabus
              </button>
              <button
                type="submit"
                disabled={generating}
                className="btn-primary bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-lg shadow"
              >
                {generating ? '🤖 Generating Question Paper...' : '🚀 Generate Question Paper'}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* ================= STEP 5: REVIEW GENERATED QUESTIONS ================= */}
      {step === 5 && generatedData && (
        <div className="card space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{generatedData.subject} Generated Examination Paper</h2>
              <p className="text-xs text-gray-600">
                Pattern: {generatedData.patternMode} | Total Marks: {generatedData.totalMarks} | Duration: {generatedData.durationMins} Mins
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded text-xs font-semibold ${generatedData.textbookState === 'TEXTBOOK_AVAILABLE_AND_RETRIEVED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                Grounding: {generatedData.textbookState}
              </span>
              <button onClick={handleSavePaper} className="btn-primary">
                💾 Save Question Paper
              </button>
            </div>
          </div>

          {/* Validation Status Banner */}
          {generatedData.validation && (
            <div className={`p-4 rounded-lg text-xs ${generatedData.validation.valid ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              <div className="font-bold mb-1">
                {generatedData.validation.valid ? '✅ Structural Pattern Validation Passed' : '⚠️ Validation Warnings'}
              </div>
              {generatedData.validation.errors?.map((err, i) => (
                <div key={i}>• {err}</div>
              ))}
            </div>
          )}

          {/* Generated Questions List */}
          <div className="space-y-4">
            {generatedData.questions?.map((q, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-gray-200 bg-white space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                  <span>{q.sectionName || `Question #${idx + 1}`} ({q.type})</span>
                  <span className="text-blue-600">{q.marks} Mark{q.marks > 1 ? 's' : ''}</span>
                </div>
                <div className="text-sm font-medium text-gray-900">{formatScientificText(q.questionText)}</div>

                {/* MCQ Options */}
                {q.options?.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 pl-4 border-l-2 border-blue-300">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx}>{formatScientificText(opt)}</div>
                    ))}
                  </div>
                )}

                {q.answerKey && (
                  <div className="text-xs font-semibold text-green-700 mt-2 bg-green-50 p-2 rounded border border-green-100">
                    Answer Key: {formatScientificText(q.answerKey)}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t">
            <button onClick={() => setStep(4)} className="btn-secondary">
              ← Regenerate / Modify Config
            </button>
            <button onClick={handleSavePaper} className="btn-primary">
              💾 Save & Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
