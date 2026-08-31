import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Skeleton, TableSkeleton } from '../components/Skeleton';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [downloadingId, setDownloadingId] = useState(null);

  // Student profile (class, stream, subjects, teachers)
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['studentProfile'],
    queryFn: async () => {
      const response = await apiClient.get('/student/profile');
      return response.data.data;
    },
  });

  // Published question papers for the student's stream (only completed tests)
  const { data: papersData, isLoading: papersLoading, error: papersError } = useQuery({
    queryKey: ['studentPublishedQPs'],
    queryFn: async () => {
      const response = await apiClient.get('/student/qp');
      return response.data;
    },
  });

  const papers = papersData?.data || [];
  const { data: materialsData } = useQuery({
    queryKey: ['studentStudyMaterials'],
    queryFn: async () => (await apiClient.get('/student/documents')).data.data || [],
  });

  // Download PDF file for student
  const handleDownloadPaper = async (paper) => {
    setDownloadingId(paper.id);
    try {
      const response = await apiClient.get(`/student/qp/${paper.id}/export`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${paper.title}-QuestionPaper.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('Question paper PDF downloaded successfully!', 'success');
    } catch (err) {
      showToast(`Failed to download paper PDF: ${err.message}`, 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Student Dashboard</h1>
        {!profileLoading && profile && (
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Welcome back, {user?.name}. Class: {profile.class?.name || 'N/A'} &middot; Stream: {profile.stream?.name || 'N/A'}
          </p>
        )}
      </div>

      {/* Profile Summary */}
      <div className="card space-y-4">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Your Account Details</h2>
        {profileLoading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : profile ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <p className="text-xs text-slate-500 font-semibold">Student ID</p>
              <p className="font-bold text-sm text-slate-900 mt-0.5">{profile.uniqueId}</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <p className="text-xs text-slate-500 font-semibold">Class</p>
              <p className="font-bold text-sm text-slate-900 mt-0.5">{profile.class?.name || 'N/A'}</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <p className="text-xs text-slate-500 font-semibold">Stream</p>
              <p className="font-bold text-sm text-slate-900 mt-0.5">{profile.stream?.name || 'N/A'}</p>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Unable to load profile.</p>
        )}
      </div>

      {/* Published Question Papers (Completed Tests Only) */}
      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Completed Test Question Papers</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Question papers are published here once the scheduled test duration is completed.
            </p>
          </div>
          <span className="badge badge-success text-xs font-bold">
            ✓ Post-Exam Archive
          </span>
        </div>

        {papersLoading && (
          <TableSkeleton rows={5} columns={6} />
        )}

        {papersError && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 font-medium">
            Failed to load question papers. {papersError.message}
          </div>
        )}

        {!papersLoading && papers.length === 0 && (
          <div className="py-8 text-center space-y-2">
            <p className="text-slate-600 font-bold text-base">No Published Test Papers Available Yet</p>
            <p className="text-slate-500 text-xs max-w-md mx-auto">
              Question papers generated by teachers will appear here automatically for viewing and download as soon as their scheduled test session ends.
            </p>
          </div>
        )}

        {!papersLoading && papers.length > 0 && (
          <div className="table-responsive-container">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Title</th>
                  <th className="px-5 py-3.5">Subject</th>
                  <th className="px-5 py-3.5">Marks</th>
                  <th className="px-5 py-3.5">Duration</th>
                  <th className="px-5 py-3.5">Difficulty</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {papers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-900">{paper.title}</td>
                    <td className="px-5 py-4 text-slate-600">{paper.subject?.name}</td>
                    <td className="px-5 py-4 text-slate-600">{paper.totalMarks} marks</td>
                    <td className="px-5 py-4 text-slate-600">{paper.durationMins} mins</td>
                    <td className="px-5 py-4">
                      <span className="badge badge-info">{paper.difficulty}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/paper/${paper.id}`}
                          title="View Question Paper"
                          className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center justify-center"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDownloadPaper(paper)}
                          disabled={downloadingId === paper.id}
                          title="Download Question Paper PDF"
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                          {downloadingId === paper.id ? (
                            <span className="spinner w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          )}
                        </button>
                      </div>
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
