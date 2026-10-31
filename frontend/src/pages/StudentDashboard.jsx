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
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Dashboard</h1>
        {!profileLoading && profile && (
          <p className="mt-1 text-sm text-slate-500 font-normal">
            Welcome back, {user?.name}. Class: {profile.class?.name || 'N/A'} &middot; Stream: {profile.stream?.name || 'N/A'}
          </p>
        )}
      </div>

      {/* Profile Summary */}
      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2.5">Your Account Details</h2>
        {profileLoading ? (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : profile ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-lg">
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Student ID</p>
              <p className="font-semibold text-sm text-slate-900 mt-0.5">{profile.uniqueId}</p>
            </div>
            <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-lg">
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Class</p>
              <p className="font-semibold text-sm text-slate-900 mt-0.5">{profile.class?.name || 'N/A'}</p>
            </div>
            <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-lg">
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Stream</p>
              <p className="font-semibold text-sm text-slate-900 mt-0.5">{profile.stream?.name || 'N/A'}</p>
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
            <h2 className="text-base font-semibold text-slate-900">Completed Test Question Papers</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Question papers are published here once the scheduled test duration is completed.
            </p>
          </div>
          <span className="badge badge-success text-[11px]">
            Archived Papers
          </span>
        </div>

        {papersLoading && (
          <TableSkeleton rows={5} columns={6} />
        )}

        {papersError && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs font-medium text-rose-700">
            Failed to load question papers. {papersError.message}
          </div>
        )}

        {!papersLoading && papers.length === 0 && (
          <div className="py-12 text-center space-y-1.5">
            <p className="text-slate-800 font-semibold text-sm">No Published Papers Available Yet</p>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              Question papers prepared by your teachers will appear here automatically for review and download once test sessions conclude.
            </p>
          </div>
        )}

        {!papersLoading && papers.length > 0 && (
          <div className="table-responsive-container">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Marks</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {papers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{paper.title}</td>
                    <td className="px-4 py-3 text-slate-600">{paper.subject?.name}</td>
                    <td className="px-4 py-3 text-slate-600">{paper.totalMarks} marks</td>
                    <td className="px-4 py-3 text-slate-600">{paper.durationMins} mins</td>
                    <td className="px-4 py-3">
                      <span className="badge badge-neutral">{paper.difficulty}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/paper/${paper.id}`}
                          title="View Question Paper"
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-colors"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDownloadPaper(paper)}
                          disabled={downloadingId === paper.id}
                          title="Download PDF"
                          className="px-2.5 py-1 text-xs font-medium text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors disabled:opacity-50"
                        >
                          {downloadingId === paper.id ? 'Downloading...' : 'PDF'}
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
