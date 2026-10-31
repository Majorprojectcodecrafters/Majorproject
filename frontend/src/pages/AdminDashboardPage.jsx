import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { Skeleton } from '../components/Skeleton';

export default function AdminDashboardPage() {
  const [filters, setFilters] = useState({
    search: '',
    subject: '',
    status: '',
    from: '',
    to: ''
  });

  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/dashboard');
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-9 w-48" />
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-20" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs font-medium text-rose-700">
          Failed to load dashboard data. Please try again.
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Users', value: dashboard.users?.total || 0 },
    { label: 'Teachers', value: dashboard.users?.teachers || 0 },
    { label: 'Students', value: dashboard.users?.students || 0 },
    { label: 'Classes', value: dashboard.academic?.classes || 0 },
    { label: 'Subjects', value: dashboard.academic?.subjects || 0 },
    { label: 'Chapters', value: dashboard.academic?.chapters || 0 },
  ];

  const qpDraftCount = dashboard.questionPapers?.DRAFT || 0;
  const qpPublishedCount = dashboard.questionPapers?.PUBLISHED || 0;

  const papers = dashboard.questionPaperList || [];
  const subjects = [...new Set(papers.map((paper) => paper.subject?.name).filter(Boolean))].sort();
  const filteredPapers = papers.filter((paper) => {
    const paperDate = new Date(paper.createdAt);
    const search = filters.search.trim().toLowerCase();
    return (!search || paper.title.toLowerCase().includes(search))
      && (!filters.subject || paper.subject?.name === filters.subject)
      && (!filters.status || paper.status === filters.status)
      && (!filters.from || paperDate >= new Date(`${filters.from}T00:00:00`))
      && (!filters.to || paperDate <= new Date(`${filters.to}T23:59:59`));
  });

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 font-normal">System statistics, user accounts, academic entities, and question paper catalog.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat, idx) => (
          <div key={idx} className="card p-4">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions & Question Paper Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card md:col-span-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center bg-slate-50/70 border-slate-200">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Curriculum & Student Materials</h2>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Upload textbook PDFs, board schemes, and notes. Uploaded materials feed directly into RAG generation and student libraries.
            </p>
          </div>
          <Link to="/admin/knowledge-base" className="btn-primary shrink-0 text-center text-xs">
            Manage Study Materials
          </Link>
        </div>

        <div className="card flex items-center justify-around p-4">
          <div className="text-center">
            <span className="badge badge-warning text-[11px] font-semibold">Draft Papers</span>
            <p className="mt-1.5 text-2xl font-bold text-slate-900">{qpDraftCount}</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center">
            <span className="badge badge-success text-[11px] font-semibold">Published</span>
            <p className="mt-1.5 text-2xl font-bold text-slate-900">{qpPublishedCount}</p>
          </div>
        </div>
      </div>

      {/* Papers Table */}
      <div className="card space-y-5">
        <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">All Question Papers</h2>
        
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder="Search title..."
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

        {filteredPapers.length === 0 ? (
          <p className="text-slate-500 py-10 text-center text-sm font-normal">No question papers match the current filters.</p>
        ) : (
          <div className="table-responsive-container">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredPapers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{paper.title}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{paper.subject?.name}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${paper.status === 'PUBLISHED' ? 'badge-success' : 'badge-warning'}`}>
                        {paper.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(paper.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/paper/${paper.id}`}
                        className="text-xs font-medium text-slate-900 hover:text-slate-700 underline underline-offset-2"
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
