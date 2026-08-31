import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Skeleton } from '../components/Skeleton';

export default function AdminUserManagementPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [roleFilter, setRoleFilter] = useState(''); // '' | 'TEACHER' | 'STUDENT'
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form state for Add/Edit user
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    dob: '2005-01-01',
    classId: '',
    streamId: '',
    education: '',
    experienceYears: 0,
    contact: '',
    uniqueId: ''
  });

  // 1. Fetch Users List
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['adminUsers', roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roleFilter) params.append('role', roleFilter);
      params.append('limit', '100');
      const res = await apiClient.get(`/admin/users?${params.toString()}`);
      return res.data.data || [];
    }
  });

  // 2. Fetch Classes for Student assignment
  const { data: classes = [] } = useQuery({
    queryKey: ['curriculum-classes'],
    queryFn: async () => {
      const res = await apiClient.get('/auth/classes');
      return res.data.data || [];
    }
  });

  // Create User Mutation
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await apiClient.post('/admin/users', payload);
      return res.data.data;
    },
    onSuccess: () => {
      showToast('User created successfully!', 'success');
      setShowAddModal(false);
      resetForm();
      refetchUsers();
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to create user', 'error');
    }
  });

  // Update User Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await apiClient.put(`/admin/users/${id}`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      showToast('User updated successfully!', 'success');
      setEditingUser(null);
      resetForm();
      refetchUsers();
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to update user', 'error');
    }
  });

  // Delete User Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiClient.delete(`/admin/users/${id}`);
      return res.data;
    },
    onSuccess: () => {
      showToast('User deleted successfully!', 'success');
      refetchUsers();
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to delete user', 'error');
    }
  });

  const resetForm = () => {
    setUserForm({
      name: '',
      email: '',
      password: '',
      role: 'STUDENT',
      dob: '2005-01-01',
      classId: '',
      streamId: '',
      education: '',
      experienceYears: 0,
      contact: '',
      uniqueId: ''
    });
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role,
      dob: user.dob ? user.dob.split('T')[0] : '2005-01-01',
      classId: user.student?.classId || '',
      streamId: user.student?.streamId || '',
      education: user.teacher?.education || '',
      experienceYears: user.teacher?.experienceYears || 0,
      contact: user.student?.contact || '',
      uniqueId: user.student?.uniqueId || ''
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, payload: userForm });
    } else {
      createMutation.mutate(userForm);
    }
  };

  const filteredUsers = (usersData || []).filter((u) => {
    const s = searchTerm.toLowerCase().trim();
    if (!s) return true;
    return (
      u.name?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s) ||
      u.student?.uniqueId?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl"></span>
            <h1 className="text-2xl font-bold text-gray-900">{t('userManagementTitle', 'User Management (Teachers & Students)')}</h1>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {t('userManagementSubtitle', 'Manage teacher profiles, student class allocations, credentials, and accounts.')}
          </p>
        </div>

        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="btn-primary flex items-center gap-2 text-xs font-bold py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
        >
          {t('addNewUserBtn', '+ Add New User (Teacher / Student)')}
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRoleFilter('')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              roleFilter === '' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {t('allUsersTab', 'All Users')} ({usersData?.length || 0})
          </button>
          <button
            onClick={() => setRoleFilter('TEACHER')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              roleFilter === 'TEACHER' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {t('teachersTab', 'Teachers')} ({usersData?.filter(u => u.role === 'TEACHER').length || 0})
          </button>
          <button
            onClick={() => setRoleFilter('STUDENT')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              roleFilter === 'STUDENT' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {t('studentsTab', 'Students')} ({usersData?.filter(u => u.role === 'STUDENT').length || 0})
          </button>
        </div>

        <input
          type="text"
          placeholder={t('searchUserPlaceholder', 'Search by name, email, or Student ID...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field max-w-xs text-xs py-2 bg-white"
        />
      </div>

      {/* User Table */}
      <div className="card shadow-sm border border-slate-200">
        {usersLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <span className="text-4xl block mb-2"></span>
            <p className="font-semibold text-slate-700">{t('noUsersFoundFilter', 'No users found matching your filter criteria.')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 text-slate-700 text-xs uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">{t('userDetailsCol', 'USER DETAILS')}</th>
                  <th className="py-3 px-4">{t('roleCol', 'ROLE')}</th>
                  <th className="py-3 px-4">{t('classDetailsCol', 'CLASS / DETAILS')}</th>
                  <th className="py-3 px-4">{t('createdDateCol', 'CREATED DATE')}</th>
                  <th className="py-3 px-4 text-right">{t('actionsCol', 'ACTIONS')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 text-xs">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {user.name}
                      <span className="block text-[11px] text-slate-500 font-normal">{user.email}</span>
                      {user.student?.uniqueId && (
                        <span className="inline-block mt-0.5 font-mono text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                          ID: {user.student.uniqueId}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                        user.role === 'TEACHER' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {user.role === 'STUDENT' ? (
                        <div>
                          <p className="font-semibold text-slate-800">{user.student?.class?.name || t('unassignedClass', 'Unassigned Class')}</p>
                          <p className="text-[10px] text-slate-400">Contact: {user.student?.contact || 'N/A'}</p>
                        </div>
                      ) : user.role === 'TEACHER' ? (
                        <div>
                          <p className="font-semibold text-slate-800">{user.teacher?.education || 'N/A'}</p>
                          <p className="text-[10px] text-slate-400">Experience: {user.teacher?.experienceYears || 0} {t('experienceUnit', 'yrs')}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">{t('systemAdminRole', 'System Administrator')}</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(user)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs border"
                      >
                        {t('editBtn', 'Edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete user account "${user.name}" (${user.email})?`)) {
                            deleteMutation.mutate(user.id);
                          }
                        }}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 rounded-lg transition-colors inline-flex items-center justify-center shadow-xs"
                        title="Delete User"
                      >
                        <svg className="w-4 h-4 text-red-600 fill-current" viewBox="0 0 24 24">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit User Modal */}
      {(showAddModal || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-5">
              <h3 className="font-bold text-lg text-slate-900">
                {editingUser ? `Edit User: ${editingUser.name}` : 'Add New User'}
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setEditingUser(null); resetForm(); }}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="label font-semibold">User Role *</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  disabled={!!editingUser}
                  className="input-field"
                >
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label font-semibold">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label font-semibold">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="label font-semibold">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Defaults to qpgen123 if blank"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="input-field"
                  />
                </div>
              )}

              {userForm.role === 'STUDENT' && (
                <div className="space-y-4 border-t pt-3 mt-3">
                  <p className="text-xs font-bold text-purple-900 uppercase tracking-wider">Student Profile Details</p>
                  <div>
                    <label className="label font-semibold">Assigned Class / Division *</label>
                    <select
                      value={userForm.classId}
                      onChange={(e) => setUserForm({ ...userForm, classId: e.target.value })}
                      className="input-field"
                    >
                      <option value="">-- Select Class --</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({cls.academicYear})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label font-semibold">Student ID / Roll No</label>
                      <input
                        type="text"
                        placeholder="e.g. STU-948201"
                        value={userForm.uniqueId}
                        onChange={(e) => setUserForm({ ...userForm, uniqueId: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="label font-semibold">Contact Number</label>
                      <input
                        type="text"
                        placeholder="Phone number"
                        value={userForm.contact}
                        onChange={(e) => setUserForm({ ...userForm, contact: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              )}

              {userForm.role === 'TEACHER' && (
                <div className="space-y-4 border-t pt-3 mt-3">
                  <p className="text-xs font-bold text-purple-900 uppercase tracking-wider">Teacher Profile Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label font-semibold">Education / Qualification</label>
                      <input
                        type="text"
                        placeholder="e.g. M.Sc Physics, B.Ed"
                        value={userForm.education}
                        onChange={(e) => setUserForm({ ...userForm, education: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="label font-semibold">Experience (Years)</label>
                      <input
                        type="number"
                        min="0"
                        value={userForm.experienceYears}
                        onChange={(e) => setUserForm({ ...userForm, experienceYears: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingUser(null); resetForm(); }}
                  className="btn-secondary w-1/3 py-2.5 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn-primary w-2/3 py-2.5 font-bold text-xs bg-blue-600 hover:bg-blue-700"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving User...' : editingUser ? 'Save User Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
