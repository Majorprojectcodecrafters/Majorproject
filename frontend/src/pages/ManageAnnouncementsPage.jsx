import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function ManageAnnouncementsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [classId, setClassId] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Teacher Assigned Classes (or All Classes if Admin)
  const { data: assignedClasses = [] } = useQuery({
    queryKey: ['teacherAssignedClassesNotice'],
    queryFn: async () => {
      if (user?.role === 'ADMIN') {
        const res = await apiClient.get('/admin/classes');
        return (res.data.data || []).map(c => ({ class: c }));
      }
      const res = await apiClient.get('/teacher/assigned-classes');
      return res.data.data || [];
    }
  });

  // 2. Fetch Active Announcements
  const { data: announcements = [], refetch } = useQuery({
    queryKey: ['manageAnnouncementsList'],
    queryFn: async () => {
      const res = await apiClient.get('/announcements');
      return res.data.data || [];
    }
  });

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast('Title and content are required', 'error');
      return;
    }

    if (user?.role === 'TEACHER' && !classId) {
      showToast('Teachers must select a target assigned class', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('content', content.trim());
    if (classId) formData.append('classId', classId);
    if (file) formData.append('attachment', file);

    setSubmitting(true);
    try {
      await apiClient.post('/announcements', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast('Announcement posted successfully!', 'success');
      setTitle('');
      setContent('');
      setClassId('');
      setFile(null);
      refetch();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to post announcement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async (id) => {
    try {
      await apiClient.delete(`/announcements/${id}`);
      showToast('Announcement deleted!', 'success');
      refetch();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete announcement', 'error');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Manage Notices & Announcements</h1>
        <p className="mt-1 text-sm text-gray-600">
          Compose and publish announcements with optional image or PDF attachments.
        </p>
      </div>

      {/* Composer Form */}
      <form onSubmit={handleCreateNotice} className="card bg-blue-50/40 border border-blue-200 p-6 space-y-5">
        <h2 className="text-base font-bold text-blue-950 uppercase tracking-wider">
          📢 Compose New Announcement
        </h2>

        <div>
          <label className="input-label">Announcement Title <span className="text-red-500">*</span></label>
          <input
            type="text"
            placeholder="e.g. Schedule for Mid-Term Examination 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field bg-white"
            required
          />
        </div>

        <div>
          <label className="input-label">Target Audience / Class</label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="input-field bg-white"
            required={user?.role === 'TEACHER'}
          >
            <option value="">{user?.role === 'ADMIN' ? '-- Broadcast to All Classes --' : '-- Select Target Assigned Class --'}</option>
            {assignedClasses.map((ac, idx) => (
              <option key={ac.class?.id || idx} value={ac.class?.id}>
                Class: {ac.class?.name} ({ac.class?.academicYear})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label">Notice Message / Content <span className="text-red-500">*</span></label>
          <textarea
            rows="4"
            placeholder="Enter announcement text content here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="input-field bg-white"
            required
          ></textarea>
        </div>

        <div>
          <label className="input-label">Attach File (Optional — PNG, JPG, PDF, Max 10MB)</label>
          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg, application/pdf"
            onChange={(e) => setFile(e.target.files[0] || null)}
            className="input-field bg-white text-xs file:mr-4 file:py-1.5 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={submitting} className="btn-primary min-w-44">
            {submitting ? 'Publishing...' : '📢 Publish Notice'}
          </button>
        </div>
      </form>

      {/* Active Notices Table */}
      <div className="card space-y-4">
        <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Active Announcements ({announcements.length})</h3>

        {announcements.length === 0 ? (
          <p className="py-6 text-center text-gray-500">No active announcements created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-700 uppercase">
                  <th className="p-3">Title</th>
                  <th className="p-3">Target Class</th>
                  <th className="p-3">Author</th>
                  <th className="p-3">Attachment</th>
                  <th className="p-3">Created Date</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {announcements.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="p-3 font-semibold text-gray-900">{a.title}</td>
                    <td className="p-3">
                      {a.class ? (
                        <span className="badge badge-info">{a.class.name}</span>
                      ) : (
                        <span className="badge badge-success">ALL (BROADCAST)</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-gray-600">{a.authorName} ({a.authorRole})</td>
                    <td className="p-3 text-xs font-bold text-blue-700">
                      {a.attachmentUrl ? (
                        <a href={a.attachmentUrl} target="_blank" rel="noreferrer" className="hover:underline">
                          🔗 {a.attachmentType}
                        </a>
                      ) : 'None'}
                    </td>
                    <td className="p-3 text-xs text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      {(user?.role === 'ADMIN' || a.authorId === user?.id) && (
                        <button
                          onClick={() => handleDeleteNotice(a.id)}
                          className="text-xs text-red-600 hover:text-red-900 font-bold"
                        >
                          Delete
                        </button>
                      )}
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
