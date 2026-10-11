import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { TableSkeleton } from '../components/Skeleton';

export default function TeacherStudentsPage() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE' | 'PENDING'
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

  // 3. Fetch Pending Students (Allocated classes requiring teacher approval)
  const { data: pendingStudents = [], isLoading: pendingLoading } = useQuery({
    queryKey: ['teacherPendingStudents'],
    queryFn: async () => {
      const res = await apiClient.get('/teacher/pending-students');
      return res.data.data || [];
    }
  });

  // Approve Student Mutation
  const approveStudentMutation = useMutation({
    mutationFn: async (student) => {
      const res = await apiClient.put(`/teacher/pending-students/${student.id}/approve`);
      return res.data;
    },
    onSuccess: (data, student) => {
      showToast(`Student "${student.user?.name}" approved! They can now log in.`, 'success');
      queryClient.invalidateQueries({ queryKey: ['teacherStudents'] });
      queryClient.invalidateQueries({ queryKey: ['teacherPendingStudents'] });
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to approve student', 'error');
    }
  });

  // Reject Student Mutation
  const rejectStudentMutation = useMutation({
    mutationFn: async (student) => {
      const res = await apiClient.delete(`/teacher/pending-students/${student.id}`);
      return res.data;
    },
    onSuccess: (data, student) => {
      showToast(`Registration for "${student.user?.name}" was rejected.`, 'info');
      queryClient.invalidateQueries({ queryKey: ['teacherPendingStudents'] });
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to reject student', 'error');
    }
  });

  // 4. Fetch Selected Student Details
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('yourStudentsPageTitle', 'Your Students')}</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">
          {t('yourStudentsSubtitle', 'Students enrolled in your assigned classes and subjects.')}
        </p>
      </div>

      {/* Assigned Classes Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {assignedClasses.length > 0 ? (
          assignedClasses.map((item) => (
            <div key={item.id} className="card border-l-4 border-blue-600 bg-blue-50/40 p-4">
              <div className="text-xs uppercase font-extrabold text-blue-800">{t('assignedClassLabel', 'Assigned Class')}</div>
              <div className="text-lg font-bold text-slate-900 mt-1">{item.class?.name || 'Class'}</div>
              <div className="text-xs text-slate-600 mt-1">{t('subject', 'Subject')}: <strong>{item.subject?.name}</strong></div>
            </div>
          ))
        ) : (
          <div className="col-span-3 card bg-amber-50 border border-amber-200 text-amber-900 p-4 text-sm font-medium">
            {t('noAllocationsWarning', 'No class allocations set by Admin yet. Displaying directly assigned students.')}
          </div>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('ACTIVE')}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'ACTIVE'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          {t('enrolledStudentsTab', 'Enrolled Students')} ({students.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('PENDING')}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'PENDING'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          {t('pendingApprovalsTab', 'Pending Approvals')} ({pendingStudents.length})
          {pendingStudents.length > 0 && (
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${activeTab === 'PENDING' ? 'bg-white' : 'bg-amber-500 animate-pulse'}`} />
          )}
        </button>
      </div>

      {activeTab === 'PENDING' ? (
        <div className="card space-y-6 border-amber-200 bg-amber-50/20">
          <div className="border-b border-amber-200/60 pb-3">
            <h2 className="text-lg font-bold text-slate-900">Pending Student Approvals</h2>
            <p className="text-xs text-slate-500 mt-1">
              Newly registered students in your allocated classes require your permission before they can log in for the first time.
            </p>
          </div>

          {pendingLoading && <TableSkeleton rows={3} columns={5} />}

          {!pendingLoading && pendingStudents.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm font-medium">
              No pending student approval requests for your allocated classes.
            </div>
          )}

          {!pendingLoading && pendingStudents.length > 0 && (
            <div className="table-responsive-container">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <th className="p-3.5">Student Details</th>
                    <th className="p-3.5">Student ID</th>
                    <th className="p-3.5">Class / Stream</th>
                    <th className="p-3.5">Registered Date</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {pendingStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{student.user?.name}</div>
                        <div className="text-xs text-slate-500 font-medium">{student.user?.email}</div>
                        {student.contact && (
                          <div className="text-[11px] text-slate-400">Contact: {student.contact}</div>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-xs text-slate-700">
                        {student.uniqueId || student.id.slice(0, 8)}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">{student.class?.name || 'Class'}</div>
                        <div className="text-xs text-slate-500">{student.stream?.name || 'Stream'}</div>
                      </td>
                      <td className="p-3.5 text-xs text-slate-500">
                        {new Date(student.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => approveStudentMutation.mutate(student)}
                          disabled={approveStudentMutation.isPending}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Reject and remove registration request for "${student.user?.name}"?`)) {
                              rejectStudentMutation.mutate(student);
                            }
                          }}
                          disabled={rejectStudentMutation.isPending}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg font-bold text-xs transition-colors"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Main Student Roster Card */
        <div className="card space-y-6">
        {/* Controls Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder={t('searchStudentPlaceholder', 'Search by student name or ID...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field max-w-xs"
            />
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="input-field max-w-xs"
            >
              <option value="">{t('allAssignedClasses', 'All Assigned Classes')}</option>
              {assignedClasses.map(ac => (
                <option key={ac.class?.id} value={ac.class?.id}>
                  {ac.class?.name} ({ac.subject?.name})
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs font-semibold text-slate-500">
            {t('totalStudentsLabel', 'Total Students')}: <span className="text-slate-900 font-bold">{filteredStudents.length}</span>
          </div>
        </div>

        {/* Table */}
        {isLoading && <TableSkeleton rows={5} columns={5} />}
        {error && <p className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm font-medium">Unable to load students.</p>}

        {!isLoading && !error && filteredStudents.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm font-medium">
            {t('noStudentsFound', 'No students found for the selected class filter.')}
          </div>
        )}

        {!isLoading && !error && filteredStudents.length > 0 && (
          <div className="table-responsive-container">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <th className="p-3.5">{t('studentNameCol', 'Student Name')}</th>
                  <th className="p-3.5">{t('studentId', 'Student ID')}</th>
                  <th className="p-3.5">{t('classDivisionCol', 'Class / Division')}</th>
                  <th className="p-3.5">{t('stream', 'Stream')}</th>
                  <th className="p-3.5 text-right">{t('performanceActionCol', 'Performance Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{student.user?.name}</div>
                      <div className="text-xs text-slate-500 font-medium">{student.user?.email}</div>
                    </td>
                    <td className="p-3.5 font-mono text-xs text-slate-700">{student.uniqueId || student.id.slice(0, 8)}</td>
                    <td className="p-3.5">
                      <span className="badge badge-info">{student.class?.name || '12th Standard'}</span>
                    </td>
                    <td className="p-3.5 text-xs text-slate-600 font-medium">{student.stream?.name || 'Science'}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="btn-secondary py-1 px-3 text-xs"
                      >
                        {t('viewPerformance', 'View Performance')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

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
