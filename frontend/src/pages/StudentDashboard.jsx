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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
        {!profileLoading && profile && (
          <p className="mt-2 text-gray-600">
            {profile.class?.name} &middot; {profile.stream?.name}
          </p>
        )}
      </div>

      {/* Profile Summary */}
      <div className="card mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Your Details</h2>
        {profileLoading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : profile ? (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Student ID</p>
              <p className="font-semibold text-gray-900">{profile.uniqueId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Class</p>
              <p className="font-semibold text-gray-900">{profile.class?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Stream</p>
              <p className="font-semibold text-gray-900">{profile.stream?.name || 'N/A'}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">Unable to load profile.</p>
        )}
      </div>


      <div className="card mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Textbooks & Past Question Papers</h2>
        {materialsLoading ? <TableSkeleton rows={3} columns={4} /> : materials.length === 0 ? (
          <p className="text-gray-600">No study materials are available for your class and subjects yet.</p>
        ) : (
          <div className="overflow-x-auto"><table className="w-full"><thead className="border-b border-gray-200 bg-gray-50"><tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Document</th><th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Type</th><th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Subject</th><th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
          </tr></thead><tbody className="divide-y divide-gray-200">{materials.map((material) => <tr key={`${material.type}-${material.fileName}`}>
            <td className="px-4 py-3 text-sm text-gray-900">{material.name}</td><td className="px-4 py-3 text-sm text-gray-600">{material.type === 'pyq' ? 'Past Question Paper' : 'Textbook'}</td><td className="px-4 py-3 text-sm text-gray-600">{material.subject}</td><td className="px-4 py-3"><button onClick={() => openMaterial(material)} className="text-sm text-blue-600 hover:text-blue-900">Open / Download</button></td>
          </tr>)}</tbody></table></div>
        )}
      </div>
      {/* Published Question Papers */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Available Question Papers</h2>

        {papersLoading && (
          <TableSkeleton rows={5} columns={6} />
        )}

        {papersError && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            Failed to load question papers. {papersError.message}
          </div>
        )}

        {!papersLoading && papers.length === 0 && (
          <p className="text-gray-600">
            No published question papers yet. Check back once your teacher publishes one.
          </p>
        )}

        {!papersLoading && papers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Subject</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Marks</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Duration</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Difficulty</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {papers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{paper.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{paper.subject?.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{paper.totalMarks}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{paper.durationMins} mins</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{paper.difficulty}</td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/paper/${paper.id}`}
                        className="text-sm text-blue-600 hover:text-blue-900"
                      >
                        View
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
