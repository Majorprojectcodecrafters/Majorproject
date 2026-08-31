import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { TableSkeleton } from '../components/Skeleton';

export default function TeacherStudentsPage() {
  const [selectedClassId, setSelectedClassId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // 1. Fetch Teacher's Assigned Classes
  const { data: assignedClasses = [] } = useQuery({
    queryKey: ['teacherAssignedClasses'],
    queryFn: async () => {
      const res = await apiClient.get('/teacher/assigned-classes');
      return res.data.data || [];
    }
  });

  // 2. Fetch Assigned Students
  const { data: students = [], isLoading, error } = useQuery({
    queryKey: ['teacherStudents', selectedClassId],
    queryFn: async () => {
      const res = await apiClient.get('/teacher/students', {
        params: { classId: selectedClassId || undefined, limit: 100 }
      });
      return res.data.data || [];
    }
  });

  // 3. Fetch Selected Student Details
  const { data: studentDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['studentDetail', selectedStudent?.id],
    queryFn: async () => {
      if (!selectedStudent?.id) return null;
      const res = await apiClient.get(`/teacher/students/${selectedStudent.id}`);
      return res.data.data || null;
    },
    enabled: !!selectedStudent?.id
  });

  const filteredStudents = students.filter(s => {
    const name = s.user?.name || '';
    const email = s.user?.email || '';
    const uid = s.uniqueId || '';
    const q = searchQuery.toLowerCase();
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || uid.toLowerCase().includes(q);
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Your Students</h1>
        <p className="mt-1 text-sm text-gray-600">
          Students enrolled in your assigned classes and subjects.
        </p>
      </div>

      {/* Assigned Classes Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {assignedClasses.length > 0 ? (
          assignedClasses.map((item) => (
            <div key={item.id} className="card border-l-4 border-blue-600 bg-blue-50/40 p-4">
              <div className="text-xs uppercase font-semibold text-blue-800">Assigned Class</div>
              <div className="text-lg font-bold text-gray-900 mt-1">{item.class?.name || 'Class'}</div>
              <div className="text-xs text-gray-600 mt-1">Subject: <strong>{item.subject?.name}</strong></div>
            </div>
          ))
        ) : (
          <div className="col-span-3 card bg-amber-50 border border-amber-200 text-amber-800 p-4 text-sm">
            No class allocations set by Admin yet. Displaying directly assigned students.
          </div>
        )}
      </div>

      {/* Main Student Roster Card */}
      <div className="card space-y-6">
        {/* Controls Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search by student name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field max-w-xs"
            />
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="input-field max-w-xs"
            >
              <option value="">All Assigned Classes</option>
              {assignedClasses.map(ac => (
                <option key={ac.class?.id} value={ac.class?.id}>
                  {ac.class?.name} ({ac.subject?.name})
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs font-semibold text-gray-500">
            Total Students: <span className="text-gray-900 font-bold">{filteredStudents.length}</span>
          </div>
        </div>

        {/* Table */}
        {isLoading && <TableSkeleton rows={5} columns={5} />}
        {error && <p className="rounded bg-red-50 p-4 text-red-700">Unable to load students.</p>}

        {!isLoading && !error && filteredStudents.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No students found for the selected class filter.
          </div>
        )}

        {!isLoading && !error && filteredStudents.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-700 uppercase">
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Student ID</th>
                  <th className="p-3">Class / Division</th>
                  <th className="p-3">Stream</th>
                  <th className="p-3 text-right">Performance Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/80">
                    <td className="p-3">
                      <div className="font-semibold text-gray-900">{student.user?.name}</div>
                      <div className="text-xs text-gray-500">{student.user?.email}</div>
                    </td>
                    <td className="p-3 font-mono text-xs text-gray-700">{student.uniqueId || student.id.slice(0, 8)}</td>
                    <td className="p-3">
                      <span className="badge badge-info">{student.class?.name || '12th Standard'}</span>
                    </td>
                    <td className="p-3 text-xs text-gray-600">{student.stream?.name || 'Science'}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="btn-secondary py-1 text-xs"
                      >
                        View Performance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Performance Review Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedStudent.user?.name}</h2>
                <p className="text-xs text-gray-500">
                  ID: {selectedStudent.uniqueId} | Class: {selectedStudent.class?.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {detailLoading ? (
              <div className="py-8 text-center text-gray-500">Loading student performance...</div>
            ) : studentDetail ? (
              <div className="space-y-6">
                {/* Test Results Section */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                    Exam / Test Results ({studentDetail.examResults?.length || 0})
                  </h3>

                  {studentDetail.examResults?.length > 0 ? (
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b font-semibold text-gray-700">
                          <tr>
                            <th className="p-2">Test / Paper Title</th>
                            <th className="p-2">Subject</th>
                            <th className="p-2">Score</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {studentDetail.examResults.map((r) => (
                            <tr key={r.id}>
                              <td className="p-2 font-medium text-gray-900">{r.questionPaper?.title}</td>
                              <td className="p-2">{r.questionPaper?.subject?.name}</td>
                              <td className="p-2 font-bold text-blue-700">
                                {r.obtainedMarks} / {r.questionPaper?.totalMarks || 100}
                              </td>
                              <td className="p-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {r.isPassed ? 'PASS' : 'FAIL'}
                                </span>
                              </td>
                              <td className="p-2 text-gray-500">{new Date(r.examDate).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded">No written test results recorded yet.</p>
                  )}
                </div>

                {/* Online Quiz Results Section */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                    Online Quiz Attempts ({studentDetail.quizAttempts?.length || 0})
                  </h3>

                  {studentDetail.quizAttempts?.length > 0 ? (
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b font-semibold text-gray-700">
                          <tr>
                            <th className="p-2">Quiz Title</th>
                            <th className="p-2">Subject</th>
                            <th className="p-2">Score</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Submitted</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {studentDetail.quizAttempts.map((qa) => (
                            <tr key={qa.id}>
                              <td className="p-2 font-medium text-gray-900">{qa.quiz?.title}</td>
                              <td className="p-2">{qa.quiz?.subject?.name}</td>
                              <td className="p-2 font-bold text-purple-700">
                                {qa.score} / {qa.totalMarks} ({((qa.score / qa.totalMarks) * 100).toFixed(1)}%)
                              </td>
                              <td className="p-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${qa.isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {qa.isPassed ? 'PASS' : 'FAIL'}
                                </span>
                              </td>
                              <td className="p-2 text-gray-500">{new Date(qa.submittedAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded">No online quiz attempts recorded yet.</p>
                  )}
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-4 border-t">
              <button onClick={() => setSelectedStudent(null)} className="btn-secondary">
                Close Performance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
