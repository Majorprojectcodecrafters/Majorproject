import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function CreateResultPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [selectedQPId, setSelectedQPId] = useState('');
  const [studentMarksMap, setStudentMarksMap] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Teacher's Question Papers (Tests)
  const { data: qps = [], isLoading: qpLoading } = useQuery({
    queryKey: ['teacherQuestionPapersForResults'],
    queryFn: async () => {
      const res = await apiClient.get('/teacher/qp');
      return res.data.data || [];
    }
  });

  const selectedQP = qps.find(q => q.id === selectedQPId);

  // 2. Fetch Assigned Students for Teacher
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['teacherStudentsForResults'],
    queryFn: async () => {
      const res = await apiClient.get('/teacher/students', { params: { limit: 200 } });
      return res.data.data || [];
    }
  });

  // 3. Fetch Existing Results for Selected Test
  const { data: existingResults = [], refetch: refetchResults } = useQuery({
    queryKey: ['examResults', selectedQPId],
    queryFn: async () => {
      if (!selectedQPId) return [];
      const res = await apiClient.get('/teacher/results/exam', { params: { limit: 200 } });
      const filtered = (res.data.data || []).filter(r => r.questionPaperId === selectedQPId);
      return filtered;
    },
    enabled: !!selectedQPId
  });

  // Populate student marks map when test or existing results change
  useEffect(() => {
    if (!selectedQPId) return;
    const initialMap = {};
    existingResults.forEach(r => {
      initialMap[r.studentId] = r.obtainedMarks;
    });
    setStudentMarksMap(initialMap);
  }, [selectedQPId, existingResults]);

  const handleMarkChange = (studentId, val) => {
    setStudentMarksMap(prev => ({
      ...prev,
      [studentId]: val
    }));
  };

  const handleSaveResult = async (studentId) => {
    if (!selectedQPId || !selectedQP) {
      showToast('Please select a test paper first', 'error');
      return;
    }
    const val = studentMarksMap[studentId];
    if (val === undefined || val === '') {
      showToast('Please enter obtained marks', 'error');
      return;
    }

    const marksNum = Number(val);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > selectedQP.totalMarks) {
      showToast(`Marks must be between 0 and ${selectedQP.totalMarks}`, 'error');
      return;
    }

    try {
      await apiClient.post('/teacher/results/exam', {
        studentId,
        questionPaperId: selectedQPId,
        obtainedMarks: marksNum,
        examDate: selectedQP.examDate || new Date()
      });
      showToast('Marks saved successfully!', 'success');
      refetchResults();
      queryClient.invalidateQueries({ queryKey: ['examResults'] });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save marks', 'error');
    }
  };

  const handleSaveAllResults = async () => {
    if (!selectedQPId || !selectedQP) {
      showToast('Please select a test paper first', 'error');
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const student of students) {
      const val = studentMarksMap[student.id];
      if (val !== undefined && val !== '') {
        const marksNum = Number(val);
        if (!isNaN(marksNum) && marksNum >= 0 && marksNum <= selectedQP.totalMarks) {
          try {
            await apiClient.post('/teacher/results/exam', {
              studentId: student.id,
              questionPaperId: selectedQPId,
              obtainedMarks: marksNum,
              examDate: selectedQP.examDate || new Date()
            });
            successCount++;
          } catch (e) {
            errorCount++;
          }
        }
      }
    }

    setIsSubmitting(false);
    if (successCount > 0) {
      showToast(`Successfully published ${successCount} student results!`, 'success');
      refetchResults();
      queryClient.invalidateQueries({ queryKey: ['examResults'] });
    } else {
      showToast('No valid marks entered to save', 'info');
    }
  };

  const downloadExcel = () => {
    if (!selectedQPId) return;
    const token = localStorage.getItem('token');
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/teacher/results/export/excel?questionPaperId=${selectedQPId}&token=${token}`, '_blank');
  };

  const downloadPDF = () => {
    if (!selectedQPId) return;
    const token = localStorage.getItem('token');
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/teacher/results/export/pdf?questionPaperId=${selectedQPId}&token=${token}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('createPublishResultsTitle', 'Create & Publish Test Results')}</h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            {t('createPublishResultsSubtitle', 'Select a generated question paper, manually enter student marks, and export result sheets to Excel or PDF.')}
          </p>
        </div>
      </div>

      {/* Test Selection Bar */}
      <div className="card bg-blue-50/50 border border-blue-200 p-6 space-y-4">
        <label className="block text-xs font-bold text-blue-950 uppercase tracking-wider">
          {t('step1SelectQP', 'STEP 1: SELECT QUESTION PAPER / TEST')}
        </label>

        {qpLoading ? (
          <p className="text-xs text-slate-500 font-medium">Loading tests...</p>
        ) : (
          <select
            value={selectedQPId}
            onChange={(e) => setSelectedQPId(e.target.value)}
            className="input-field text-sm font-semibold w-full max-w-2xl bg-white"
          >
            <option value="">{t('chooseTestQP', '-- Choose Test / Question Paper --')}</option>
            {qps.map(q => (
              <option key={q.id} value={q.id}>
                {q.title} ({q.subject?.name || 'Subject'}) — {q.totalMarks} {t('marksWord', 'Marks')}
              </option>
            ))}
          </select>
        )}

        {selectedQP && (
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-blue-200 text-xs text-blue-900">
            <div>
              <strong>{t('subject', 'Subject')}:</strong> {selectedQP.subject?.name} | <strong>{t('totalMarksLabel', 'Total Marks')}:</strong> {selectedQP.totalMarks} | <strong>{t('durationLabel', 'Duration')}:</strong> {selectedQP.durationMins} {t('mins', 'Mins')}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadExcel}
                className="btn-secondary py-1 text-xs bg-white text-emerald-700 hover:bg-emerald-50 border-emerald-300 font-bold"
              >
                {t('downloadExcelSheet', 'Download Excel Sheet')}
              </button>
              <button
                onClick={downloadPDF}
                className="btn-secondary py-1 text-xs bg-white text-red-700 hover:bg-red-50 border-red-300 font-bold"
              >
                {t('downloadResultPdf', 'Download Result PDF')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Marks Entry Section */}
      {selectedQPId && (
        <div className="card space-y-6 shadow-sm border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t('step2EnterMarks', 'Step 2: Enter Student Marks')}</h2>
              <p className="text-xs text-slate-500 font-medium">
                {t('passMarkThreshold', 'Pass mark threshold:')} <strong className="text-slate-900">{(0.35 * selectedQP.totalMarks).toFixed(1)}</strong> {t('marksWord', 'marks')} (35%)
              </p>
            </div>

            <button
              onClick={handleSaveAllResults}
              disabled={isSubmitting || !students.length}
              className="btn-primary min-w-44 text-xs font-bold"
            >
              {isSubmitting ? t('publishingState', 'Publishing...') : t('savePublishAllResults', 'Save & Publish All Results')}
            </button>
          </div>

          {studentsLoading ? (
            <p className="py-8 text-center text-xs text-slate-500 font-medium">{t('loadingAssignedStudents', 'Loading assigned students...')}</p>
          ) : students.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500 font-medium">{t('noAssignedStudents', 'No assigned students found for your classes.')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 uppercase">
                    <th className="p-3">{t('srNoCol', 'Sr.')}</th>
                    <th className="p-3">{t('studentNameCol', 'Student Name')}</th>
                    <th className="p-3">{t('studentId', 'Student ID')}</th>
                    <th className="p-3">{t('classDivisionCol', 'Class / Division')}</th>
                    <th className="p-3">{t('obtainedMarksCol', 'Obtained Marks')} ({t('outOf', 'out of')} {selectedQP.totalMarks})</th>
                    <th className="p-3 text-center">{t('status', 'Status')}</th>
                    <th className="p-3 text-right">{t('actions', 'Action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {students.map((student, idx) => {
                    const currentVal = studentMarksMap[student.id] ?? '';
                    const numericVal = Number(currentVal);
                    const hasVal = currentVal !== '' && !isNaN(numericVal);
                    const isPassed = hasVal ? numericVal >= (0.35 * selectedQP.totalMarks) : null;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 text-xs text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-900">{student.user?.name}</td>
                        <td className="p-3 text-xs font-mono text-slate-600">{student.uniqueId || 'N/A'}</td>
                        <td className="p-3 text-xs text-slate-600">{student.class?.name || '12th Standard'}</td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="0"
                            max={selectedQP.totalMarks}
                            step="0.5"
                            placeholder={`0 - ${selectedQP.totalMarks}`}
                            value={currentVal}
                            onChange={(e) => handleMarkChange(student.id, e.target.value)}
                            className="input-field w-32 py-1 text-sm font-bold text-slate-900"
                          />
                        </td>
                        <td className="p-3 text-center">
                          {isPassed === true && (
                            <span className="badge badge-success px-3 py-1 font-bold text-xs">{t('passBadge', 'PASS')}</span>
                          )}
                          {isPassed === false && (
                            <span className="badge badge-error px-3 py-1 font-bold text-xs">{t('failBadge', 'FAIL')}</span>
                          )}
                          {isPassed === null && (
                            <span className="text-xs text-slate-400 font-medium">{t('pendingStatus', 'Pending')}</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleSaveResult(student.id)}
                            className="btn-secondary py-1 px-3 text-xs font-bold"
                          >
                            {t('saveMarkBtn', 'Save Mark')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
