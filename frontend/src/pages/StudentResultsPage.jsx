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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('myResultsTitle', 'My Academic Results')}</h1>
        <p className="mt-1 text-sm text-slate-500 font-normal">View semester performance reports, CGPA progression, and test scores.</p>
      </div>

      {/* CGPA Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('currentCGPA', 'Current CGPA')}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {semesterLoading ? '—' : summary?.currentCGPA ?? 'N/A'}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('semestersCompleted', 'Semesters Completed')}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {semesterLoading ? '—' : summary?.totalSemesters ?? 0}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('creditsEarned', 'Credits Earned')}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {semesterLoading ? '—' : `${summary?.earnedCredits ?? 0}/${summary?.totalCredits ?? 0}`}
          </p>
        </div>
      </div>

      {/* Semester Results */}
      <div className="card space-y-4">
        <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-2.5">{t('semesterPerformanceTitle', 'Semester-wise Performance')}</h2>
        {semesterLoading ? (
          <TableSkeleton rows={4} columns={4} />
        ) : semesterResults.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">{t('noSemesterResults', 'No semester results published yet.')}</p>
        ) : (
          <div className="table-responsive-container">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3">{t('semesterCol', 'Semester')}</th>
                  <th className="px-4 py-3">{t('academicYearCol', 'Academic Year')}</th>
                  <th className="px-4 py-3">SGPA</th>
                  <th className="px-4 py-3">CGPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                {semesterResults.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">Semester {r.semester}</td>
                    <td className="px-4 py-3 text-slate-600">{r.academicYear}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{r.sgpa}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{r.cgpa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Exam Results */}
      <div className="card space-y-4">
        <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-2.5">{t('examResultsTitle', 'Exam Results')}</h2>

        {examLoading && (
          <TableSkeleton rows={5} columns={6} />
        )}

        {examError && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs font-medium text-rose-700">
            Failed to load exam results. {examError.message}
          </div>
        )}

        {!examLoading && examResults.length === 0 && (
          <p className="text-xs text-slate-500 py-8 text-center">{t('noExamResultsYet', 'No exam results published yet.')}</p>
        )}

        {!examLoading && examResults.length > 0 && (
          <div className="table-responsive-container">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3">{t('paperCol', 'Paper')}</th>
                  <th className="px-4 py-3">{t('subject', 'Subject')}</th>
                  <th className="px-4 py-3">{t('marksObtainedCol', 'Marks Obtained')}</th>
                  <th className="px-4 py-3">{t('examDateCol', 'Exam Date')}</th>
                  <th className="px-4 py-3">{t('status', 'Result')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                {examResults.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">{r.questionPaper?.title || 'Examination Test'}</td>
                    <td className="px-4 py-3 text-slate-600">{r.questionPaper?.subject?.name || 'Subject'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {r.obtainedMarks} / {r.totalMarks}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${r.grade === 'F' ? 'badge-danger' : 'badge-success'}`}>
                        {r.grade || 'Pass'}
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
