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
      <div className="container mx-auto space-y-8 px-4 py-8">
        <Skeleton className="h-10 w-56" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-24" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          Failed to load dashboard
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

  const qpStats = [
    { label: 'Draft Papers', value: dashboard.questionPapers?.DRAFT || 0, color: 'bg-yellow-50' },
    { label: 'Published Papers', value: dashboard.questionPapers?.PUBLISHED || 0, color: 'bg-green-50' },
  ];
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="card">
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="card mb-8 flex flex-col gap-4 bg-blue-50 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Student Study Materials</h2>
          <p className="mt-1 text-sm text-gray-600">Upload textbooks and previous-year question papers. Students can access matching class and subject materials after upload.</p>
        </div>
        <Link to="/admin/knowledge-base" className="btn-primary shrink-0 text-center">Upload Study Material</Link>
      </div>

      {/* Question Paper Stats */}
      <div className="grid grid-cols-2 gap-4">
        {qpStats.map((stat, idx) => (
          <div key={idx} className={`card ${stat.color}`}>
            <p className="text-sm font-medium text-gray-900">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="card mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Question Papers</h2>
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

        {filteredPapers.length === 0 ? (
          <p className="text-gray-600">No papers match the current filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem]">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Subject</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPapers.map((paper) => (
                  <tr key={paper.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{paper.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{paper.subject?.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{paper.status}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(paper.createdAt).toLocaleDateString()}
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
