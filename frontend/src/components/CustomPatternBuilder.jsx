import { useState, useMemo, useEffect } from 'react';
import apiClient from '../lib/api';
import { useToast } from '../contexts/ToastContext';

export default function CustomPatternBuilder({
  pattern,
  initialPattern,
  onChange,
  onSavePattern,
  targetTotalMarks = 70,
  setTargetTotalMarks = () => {},
  durationMins = 180,
  setDurationMins = () => {}
}) {
  const { showToast } = useToast();
  const effectivePattern = initialPattern || pattern;

  const [patternName, setPatternName] = useState(effectivePattern?.name || 'Custom Pattern');
  const [savingToLibrary, setSavingToLibrary] = useState(false);

  const [sections, setSections] = useState(
    effectivePattern?.sections || [
      {
        sectionName: 'Section A',
        questionType: 'MCQ',
        totalQuestions: 10,
        marksPerQuestion: 1,
        questionsToAttempt: 10,
        isCompulsory: true
      },
      {
        sectionName: 'Section B',
        questionType: 'SHORT',
        totalQuestions: 8,
        marksPerQuestion: 2,
        questionsToAttempt: 6,
        isCompulsory: false
      },
      {
        sectionName: 'Section C',
        questionType: 'LONG',
        totalQuestions: 4,
        marksPerQuestion: 4,
        questionsToAttempt: 3,
        isCompulsory: false
      }
    ]
  );

  // Update parent whenever sections change
  const notifyParent = (newSections, name = patternName) => {
    setSections(newSections);
    const computedAttempted = newSections.reduce((acc, sec) => acc + (Number(sec.questionsToAttempt) || 0) * (Number(sec.marksPerQuestion) || 0), 0);

    const payload = {
      name: name || 'Custom Pattern',
      sections: newSections,
      totalMarks: computedAttempted,
      durationMins
    };
    if (onSavePattern) onSavePattern(payload);
    if (onChange) onChange(payload);
  };

  // Sync with parent immediately on initial mount
  useEffect(() => {
    notifyParent(sections, patternName);
  }, []);

  const handleSectionChange = (index, field, value) => {
    const updated = sections.map((sec, i) => {
      if (i !== index) return sec;
      const copy = { ...sec, [field]: value };
      if (field === 'totalQuestions' && Number(value) < copy.questionsToAttempt) {
        copy.questionsToAttempt = Number(value);
      }
      return copy;
    });

    notifyParent(updated);
  };

  const addSection = () => {
    const nextChar = String.fromCharCode(65 + sections.length);
    const newSection = {
      sectionName: `Section ${nextChar}`,
      questionType: 'SHORT',
      totalQuestions: 5,
      marksPerQuestion: 2,
      questionsToAttempt: 5,
      isCompulsory: true
    };
    notifyParent([...sections, newSection]);
  };

  const removeSection = (index) => {
    if (sections.length <= 1) return;
    const updated = sections.filter((_, i) => i !== index);
    notifyParent(updated);
  };

  const handleSaveToLibrary = async () => {
    if (!patternName.trim()) {
      showToast('Please enter a pattern title to save it', 'error');
      return;
    }

    try {
      setSavingToLibrary(true);
      const computedAttempted = sections.reduce((acc, sec) => acc + (Number(sec.questionsToAttempt) || 0) * (Number(sec.marksPerQuestion) || 0), 0);

      const payload = {
        name: patternName.trim(),
        totalMarks: computedAttempted,
        durationMins,
        patternData: {
          name: patternName.trim(),
          sections,
          totalMarks: computedAttempted,
          durationMins
        }
      };

      await apiClient.post('/patterns/custom', payload);
      notifyParent(sections, patternName.trim());
      showToast(`Saved "${patternName}" to your custom patterns library!`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save pattern to library', 'error');
    } finally {
      setSavingToLibrary(false);
    }
  };

  // Calculations
  const computedAvailableMarks = useMemo(() => {
    return sections.reduce((acc, sec) => acc + (Number(sec.totalQuestions) || 0) * (Number(sec.marksPerQuestion) || 0), 0);
  }, [sections]);

  const computedAttemptedMarks = useMemo(() => {
    return sections.reduce((acc, sec) => acc + (Number(sec.questionsToAttempt) || 0) * (Number(sec.marksPerQuestion) || 0), 0);
  }, [sections]);

  const totalQuestionsCount = useMemo(() => {
    return sections.reduce((acc, sec) => acc + (Number(sec.totalQuestions) || 0), 0);
  }, [sections]);

  const markMismatch = targetTotalMarks > 0 && computedAttemptedMarks !== Number(targetTotalMarks);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-blue-50 p-4 border border-blue-100">
        <div>
          <h3 className="font-semibold text-blue-900">Customized Pattern Builder</h3>
          <p className="text-xs text-blue-700">Define your paper sections, question types, marks, and attempt rules.</p>
        </div>
        <div className="flex gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700">Target Total Marks</label>
            <input
              type="number"
              min="5"
              value={targetTotalMarks}
              onChange={(e) => setTargetTotalMarks(Number(e.target.value))}
              className="input-field mt-1 w-28 text-center font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700">Duration (Mins)</label>
            <input
              type="number"
              min="15"
              value={durationMins}
              onChange={(e) => setDurationMins(Number(e.target.value))}
              className="input-field mt-1 w-28 text-center font-bold"
            />
          </div>
        </div>
      </div>

      {/* Pattern Title & Save to Library Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <label className="text-xs font-bold text-gray-700 whitespace-nowrap">Pattern Title:</label>
          <input
            type="text"
            value={patternName}
            onChange={(e) => {
              setPatternName(e.target.value);
              notifyParent(sections, e.target.value);
            }}
            placeholder="e.g. 50-Mark Physics Midterm Exam"
            className="input-field text-xs py-1 font-semibold text-gray-800"
          />
        </div>
        <button
          type="button"
          onClick={handleSaveToLibrary}
          disabled={savingToLibrary}
          className="btn-secondary text-xs font-semibold py-1.5 px-3 flex items-center gap-1.5 text-blue-700 hover:bg-blue-50 border-blue-200"
        >
          {savingToLibrary ? 'Saving...' : 'Save Pattern to Library'}
        </button>
      </div>

      {/* Sections Cards List */}
      <div className="space-y-4">
        {sections.map((section, index) => {
          const availMarks = (Number(section.totalQuestions) || 0) * (Number(section.marksPerQuestion) || 0);
          const attMarks = (Number(section.questionsToAttempt) || 0) * (Number(section.marksPerQuestion) || 0);

          return (
            <div key={index} className="card relative border-l-4 border-l-blue-600 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <input
                  type="text"
                  value={section.sectionName}
                  onChange={(e) => handleSectionChange(index, 'sectionName', e.target.value)}
                  className="font-bold text-gray-900 border-b border-dashed border-gray-400 focus:outline-none focus:border-blue-600 px-1"
                />
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-500">
                    Available: <strong className="text-gray-900">{availMarks}m</strong> | Attempted: <strong className="text-blue-600">{attMarks}m</strong>
                  </span>
                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSection(index)}
                      className="text-xs font-medium text-red-600 hover:text-red-800"
                    >
                      Delete Section
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Question Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Question Type</label>
                  <select
                    value={section.questionType}
                    onChange={(e) => handleSectionChange(index, 'questionType', e.target.value)}
                    className="input-field w-full text-sm"
                  >
                    <option value="MCQ">MCQ (Multiple Choice)</option>
                    <option value="VERY_SHORT">Very Short Answer</option>
                    <option value="SHORT">Short Answer</option>
                    <option value="LONG">Long Answer</option>
                  </select>
                </div>

                {/* Total Questions */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Total Questions</label>
                  <input
                    type="number"
                    min="1"
                    value={section.totalQuestions}
                    onChange={(e) => handleSectionChange(index, 'totalQuestions', Number(e.target.value))}
                    className="input-field w-full text-sm"
                  />
                </div>

                {/* Marks Per Question */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Marks per Question</label>
                  <input
                    type="number"
                    min="1"
                    value={section.marksPerQuestion}
                    onChange={(e) => handleSectionChange(index, 'marksPerQuestion', Number(e.target.value))}
                    className="input-field w-full text-sm"
                  />
                </div>

                {/* Questions to Attempt */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Questions to Attempt</label>
                  <input
                    type="number"
                    min="1"
                    max={section.totalQuestions}
                    value={section.questionsToAttempt}
                    onChange={(e) => handleSectionChange(index, 'questionsToAttempt', Number(e.target.value))}
                    className="input-field w-full text-sm"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={addSection}
          className="btn-secondary text-sm font-medium"
        >
          + Add Section
        </button>

        <button
          type="button"
          onClick={() => setTargetTotalMarks(computedAttemptedMarks)}
          className="text-xs text-blue-600 hover:underline"
        >
          Set Target Marks to {computedAttemptedMarks}m
        </button>
      </div>

      {/* Summary Footer */}
      <div className="rounded-lg bg-gray-100 p-4 space-y-2">
        <div className="grid grid-cols-4 gap-4 text-center font-medium text-sm text-gray-800">
          <div>Sections: <strong>{sections.length}</strong></div>
          <div>Total Questions: <strong>{totalQuestionsCount}</strong></div>
          <div>Available Marks: <strong>{computedAvailableMarks}</strong></div>
          <div>Attempted Marks: <strong className="text-blue-700">{computedAttemptedMarks}</strong></div>
        </div>

        {markMismatch && (
          <div className="mt-3 rounded bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            <strong>Total Marks Warning:</strong> Calculated attempted marks ({computedAttemptedMarks}m) do not equal selected target marks ({targetTotalMarks}m). Please adjust section attempt rules or update your target total marks.
          </div>
        )}
      </div>
    </div>
  );
}
