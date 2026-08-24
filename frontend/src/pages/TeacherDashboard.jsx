import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { TableSkeleton } from '../components/Skeleton';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [paperToDelete, setPaperToDelete] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    subject: '',
    status: '',
    from: '',
    to: ''
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['questionPapers'],
    queryFn: async () => {
      const response = await apiClient.get('/question-papers');
      return response.data.data || [];
    },
  });

  // Delete Question Paper Mutation
  const deleteMutation = useMutation({
    mutationFn: async (paperId) => {
      const response = await apiClient.delete(`/question-papers/${paperId}`);
      return response.data;
    },
    onSuccess: () => {
      showToast('Question paper deleted successfully', 'success');
      setPaperToDelete(null);
      // Immediately invalidate dashboard queries so table updates instantly without refresh
      queryClient.invalidateQueries({ queryKey: ['questionPapers'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-question-papers'] });
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to delete question paper', 'error');
    }
  });

  const papers = data || [];
  const subjects = useMemo(
    () => [...new Set(papers.map((paper) => paper.subject?.name).filter(Boolean))].sort(),
    [papers]
  );
  const filteredPapers = useMemo(() => papers.filter((paper) => {
    const paperDate = new Date(paper.createdAt);
    const search = filters.search.trim().toLowerCase();
    const matchesSearch = !search || paper.title.toLowerCase().includes(search);
    const matchesSubject = !filters.subject || paper.subject?.name === filters.subject;
    const matchesStatus = !filters.status || paper.status === filters.status;
    const matchesFrom = !filters.from || paperDate >= new Date(`${filters.from}T00:00:00`);
    const matchesTo = !filters.to || paperDate <= new Date(`${filters.to}T23:59:59`);

    return matchesSearch && matchesSubject && matchesStatus && matchesFrom && matchesTo;
  }), [papers, filters]);

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const confirmDelete = () => {
    if (paperToDelete) {
      deleteMutation.mutate(paperToDelete.id);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome, {user?.name}!</p>
        </div>
        <Link to="/generator" className="btn-primary">
          + Generate New Paper
        </Link>
      </div>

      <div className="card mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Question Papers</h2>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder="Search title"
            className="input-field"
          />
          <select
            value={filters.subject}
            onChange={(event) => updateFilter('subject', event.target.value)}
            className="input-field"
          >
            <option value="">All subjects</option>
            {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
          </select>
          <select
            value={filters.status}
            onChange={(event) => updateFilter('status', event.target.value)}
            className="input-field"
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
          <input
            type="date"
            value={filters.from}
            onChange={(event) => updateFilter('from', event.target.value)}
            className="input-field"
            aria-label="Created from"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(event) => updateFilter('to', event.target.value)}
            className="input-field"
            aria-label="Created to"
          />
        </div>

        {isLoading && (
          <TableSkeleton rows={5} columns={6} />
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            Failed to load question papers. {error.message}
          </div>
        )}

        {!isLoading && papers.length === 0 && (
          <p className="text-gray-600">No question papers yet. Create one to get started!</p>
        )}

        {!isLoading && papers.length > 0 && filteredPapers.length === 0 && (
          <p className="text-gray-600">No papers match the current filters.</p>
        )}

        {!isLoading && filteredPapers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Subject</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Marks</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPapers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{paper.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{paper.subject?.name}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`badge ${
                          paper.status === 'PUBLISHED' ? 'badge-success' : 'badge-warning'
                        }`}
                      >
                        {paper.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{paper.totalMarks}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(paper.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 flex items-center gap-3">
                      <Link
                        to={`/paper/${paper.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={() => setPaperToDelete(paper)}
                        className="text-sm font-medium text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {paperToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Delete Question Paper?</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{paperToDelete.title}"</span>?
              This will permanently remove the question paper and its associated questions from your dashboard.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPaperToDelete(null)}
                disabled={deleteMutation.isPending}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
