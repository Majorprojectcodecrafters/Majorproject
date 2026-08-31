import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton, TableSkeleton } from '../components/Skeleton';

export default function StudentDashboard() {
  const { user } = useAuth();

  // Student profile (class, stream, subjects, teachers)
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['studentProfile'],
    queryFn: async () => {
      const response = await apiClient.get('/student/profile');
      return response.data.data;
    },
  });

  // Published question papers for the student's stream
  const { data: papersData, isLoading: papersLoading, error: papersError } = useQuery({
    queryKey: ['studentPublishedQPs'],
    queryFn: async () => {
      const response = await apiClient.get('/student/qp');
      return response.data;
    },
  });

  const papers = papersData?.data || [];
  const { data: materialsData, isLoading: materialsLoading } = useQuery({
    queryKey: ['studentStudyMaterials'],
    queryFn: async () => (await apiClient.get('/student/documents')).data.data || [],
  });
  const materials = materialsData || [];
  const openMaterial = async (material) => {
    const response = await apiClient.get('/student/documents/download', {
      params: { type: material.type === 'pyq' ? 'pyq' : 'textbooks', grade: material.grade, subject: material.subject === 'General' ? 'general' : material.subject, fileName: material.fileName },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(response.data);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
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

      {/* Published Question Papers */}
      <div className="card space-y-4">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Available Question Papers</h2>

        {papersLoading && (
          <TableSkeleton rows={5} columns={6} />
        )}

        {papersError && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 font-medium">
            Failed to load question papers. {papersError.message}
          </div>
        )}

        {!papersLoading && papers.length === 0 && (
          <p className="text-slate-500 py-6 text-center text-sm font-medium">
            No published question papers available yet. Check back once your teacher publishes one.
          </p>
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
                    <td className="px-5 py-4 text-slate-600">{paper.totalMarks}</td>
                    <td className="px-5 py-4 text-slate-600">{paper.durationMins} mins</td>
                    <td className="px-5 py-4">
                      <span className="badge badge-info">{paper.difficulty}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/paper/${paper.id}`}
                        className="btn-secondary py-1 px-3 text-xs"
                      >
                        View Paper
                      </Link>
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
