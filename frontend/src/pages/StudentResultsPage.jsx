import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { Skeleton, TableSkeleton } from '../components/Skeleton';

export default function StudentResultsPage() {
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">My Results</h1>

      {/* CGPA Summary */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600">Current CGPA</p>
          <p className="text-3xl font-bold text-gray-900">
            {semesterLoading ? '—' : summary?.currentCGPA ?? 'N/A'}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Semesters Completed</p>
          <p className="text-3xl font-bold text-gray-900">
            {semesterLoading ? '—' : summary?.totalSemesters ?? 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Credits Earned</p>
          <p className="text-3xl font-bold text-gray-900">
            {semesterLoading ? '—' : `${summary?.earnedCredits ?? 0}/${summary?.totalCredits ?? 0}`}
          </p>
        </div>
      </div>

      {/* Semester Results */}
      <div className="card mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Semester-wise Performance</h2>
        {semesterLoading ? (
          <TableSkeleton rows={4} columns={4} />
        ) : semesterResults.length === 0 ? (
          <p className="text-gray-600">No semester results published yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Semester</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Academic Year</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">SGPA</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">CGPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {semesterResults.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">Semester {r.semester}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.academicYear}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.sgpa}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.cgpa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Exam Results */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Exam Results</h2>

        {examLoading && (
          <TableSkeleton rows={5} columns={6} />
        )}

        {examError && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            Failed to load exam results. {examError.message}
          </div>
        )}

        {!examLoading && examResults.length === 0 && (
          <p className="text-gray-600">No exam results yet.</p>
        )}

        {!examLoading && examResults.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Paper</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Subject</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Marks Obtained</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Exam Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {examResults.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{r.questionPaper?.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {r.questionPaper?.subject?.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {r.obtainedMarks} / {r.questionPaper?.totalMarks}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(r.examDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${r.isPassed ? 'badge-success' : 'badge-warning'}`}>
                        {r.isPassed ? 'Pass' : 'Fail'}
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
