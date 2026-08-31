import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import { Skeleton, TableSkeleton } from '../components/Skeleton';

export default function StudentResultsPage() {
  const { t } = useLanguage();

  // Exam results
  const { data: examData, isLoading: examLoading, error: examError } = useQuery({
    queryKey: ['studentExamResults'],
    queryFn: async () => {
      const response = await apiClient.get('/student/results/exam');
      return response.data;
    },
  });

  // Semester results (with CGPA summary)
  const { data: semesterData, isLoading: semesterLoading } = useQuery({
    queryKey: ['studentSemesterResults'],
    queryFn: async () => {
      const response = await apiClient.get('/student/results/semester');
      return response.data.data;
    },
  });

  const examResults = examData?.data || [];
  const semesterResults = semesterData?.results || [];
  const summary = semesterData?.summary;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 select-none">
      <h1 className="mb-8 text-3xl font-extrabold text-slate-900 tracking-tight">{t('myResultsTitle', 'My Results')}</h1>

      {/* CGPA Summary */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('currentCGPA', 'Current CGPA')}</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">
            {semesterLoading ? '—' : summary?.currentCGPA ?? 'N/A'}
          </p>
        </div>
        <div className="card shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('semestersCompleted', 'Semesters Completed')}</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">
            {semesterLoading ? '—' : summary?.totalSemesters ?? 0}
          </p>
        </div>
        <div className="card shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('creditsEarned', 'Credits Earned')}</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">
            {semesterLoading ? '—' : `${summary?.earnedCredits ?? 0}/${summary?.totalCredits ?? 0}`}
          </p>
        </div>
      </div>

      {/* Semester Results */}
      <div className="card mb-8 shadow-sm border border-slate-200">
        <h2 className="mb-4 text-lg font-bold text-slate-900">{t('semesterPerformanceTitle', 'Semester-wise Performance')}</h2>
        {semesterLoading ? (
          <TableSkeleton rows={4} columns={4} />
        ) : semesterResults.length === 0 ? (
          <p className="text-xs text-slate-500 font-medium">{t('noSemesterResults', 'No semester results published yet.')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">{t('semesterCol', 'Semester')}</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">{t('academicYearCol', 'Academic Year')}</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">SGPA</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">CGPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {semesterResults.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-900 font-bold">Semester {r.semester}</td>
                    <td className="px-6 py-4 text-slate-600">{r.academicYear}</td>
                    <td className="px-6 py-4 text-slate-600 font-bold">{r.sgpa}</td>
                    <td className="px-6 py-4 text-slate-600 font-bold">{r.cgpa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Exam Results */}
      <div className="card shadow-sm border border-slate-200">
        <h2 className="mb-4 text-lg font-bold text-slate-900">{t('examResultsTitle', 'Exam Results')}</h2>

        {examLoading && (
          <TableSkeleton rows={5} columns={6} />
        )}

        {examError && (
          <div className="rounded-lg bg-red-50 p-4 text-xs font-medium text-red-700">
            Failed to load exam results. {examError.message}
          </div>
        )}

        {!examLoading && examResults.length === 0 && (
          <p className="text-xs text-slate-500 font-medium">{t('noExamResultsYet', 'No exam results yet.')}</p>
        )}

        {!examLoading && examResults.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">{t('paperCol', 'Paper')}</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">{t('subject', 'Subject')}</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">{t('marksObtainedCol', 'Marks Obtained')}</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">{t('examDateCol', 'Exam Date')}</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">{t('status', 'Result')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {examResults.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-900 font-bold">{r.questionPaper?.title}</td>
                    <td className="px-6 py-4 text-slate-600 font-semibold">
                      {r.questionPaper?.subject?.name}
                    </td>
                    <td className="px-6 py-4 text-slate-900 font-extrabold">
                      {r.obtainedMarks} / {r.questionPaper?.totalMarks}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(r.examDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge px-3 py-1 font-bold ${r.isPassed ? 'badge-success' : 'badge-warning'}`}>
                        {r.isPassed ? t('passBadge', 'PASS') : t('failBadge', 'FAIL')}
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
  );
}
