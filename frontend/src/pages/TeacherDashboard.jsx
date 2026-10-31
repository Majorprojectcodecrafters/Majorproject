import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { TableSkeleton } from '../components/Skeleton';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('teacherDashboardTitle', 'Teacher Dashboard')}</h1>
          <p className="mt-1 text-sm text-slate-500 font-normal">{t('teacherDashboardSubtitle', 'Welcome back, {{name}}. Manage exam papers, students, and curriculum analytics.', { name: user?.name })}</p>
        </div>
        <Link to="/generator" className="btn-primary">
          {t('generateNewPaper', '+ Generate New Paper')}
        </Link>
      </div>

      <div className="card space-y-5">
        <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">{t('recentQuestionPapers', 'Recent Question Papers')}</h2>

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <input
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder={t('searchTitle', 'Search title...')}
            className="input-field"
          />
          <select
            value={filters.subject}
            onChange={(event) => updateFilter('subject', event.target.value)}
            className="input-field"
          >
            <option value="">{t('allSubjects', 'All subjects')}</option>
            {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
          </select>
          <select
            value={filters.status}
            onChange={(event) => updateFilter('status', event.target.value)}
            className="input-field"
          >
            <option value="">{t('allStatuses', 'All statuses')}</option>
            <option value="DRAFT">{t('draft', 'Draft')}</option>
            <option value="PUBLISHED">{t('published', 'Published')}</option>
          </select>
          <input
            type="date"
            value={filters.from}
            onChange={(event) => updateFilter('from', event.target.value)}
            className="input-field text-xs"
            aria-label="Created from"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(event) => updateFilter('to', event.target.value)}
            className="input-field text-xs"
            aria-label="Created to"
          />
        </div>

        {isLoading && (
          <TableSkeleton rows={5} columns={6} />
        )}

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs font-medium text-rose-700">
            Failed to load question papers. {error.message}
          </div>
        )}

        {!isLoading && papers.length === 0 && (
          <p className="text-slate-500 py-10 text-center text-sm font-normal">{t('noPapersYet', 'No question papers created yet. Generate one to get started!')}</p>
        )}

        {!isLoading && papers.length > 0 && filteredPapers.length === 0 && (
          <p className="text-slate-500 py-10 text-center text-sm font-normal">{t('noMatchingPapers', 'No papers match the current search filters.')}</p>
        )}

        {!isLoading && filteredPapers.length > 0 && (
          <div className="table-responsive-container">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-xs font-semibold">
                <tr>
                  <th className="px-5 py-3">{t('title', 'Title')}</th>
                  <th className="px-5 py-3">{t('subject', 'Subject')}</th>
                  <th className="px-5 py-3">{t('status', 'Status')}</th>
                  <th className="px-5 py-3">{t('marks', 'Marks')}</th>
                  <th className="px-5 py-3">{t('created', 'Created')}</th>
                  <th className="px-5 py-3 text-right">{t('actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredPapers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-900">{paper.title}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{paper.subject?.name}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`badge ${
                          paper.status === 'PUBLISHED' ? 'badge-success' : 'badge-warning'
                        }`}
                      >
                        {paper.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{paper.totalMarks}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">
                      {new Date(paper.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          to={`/paper/${paper.id}`}
                          className="text-xs font-medium text-slate-900 hover:text-slate-700 underline underline-offset-2"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPaperToDelete(paper)}
                          className="text-xs font-medium text-rose-600 hover:text-rose-800"
                        >
                          Delete
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

      {/* Delete Confirmation Modal */}
      {paperToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <h3 className="text-base font-bold text-slate-900">Delete Question Paper?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete <span className="font-semibold text-slate-900">"{paperToDelete.title}"</span>?
              This will permanently remove the question paper and its questions.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
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
                className="btn-danger"
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
