import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { useToast } from '../contexts/ToastContext';

export default function AdminAllocationsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('allocations'); // 'allocations' | 'classes' | 'students'
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  const [newClassName, setNewClassName] = useState('');
  const [newClassAcademicYear, setNewClassAcademicYear] = useState('2026-2027');

  const [reassignStudentId, setReassignStudentId] = useState('');
  const [reassignTargetClassId, setReassignTargetClassId] = useState('');

  // 1. Fetch Teachers
  const { data: users = [] } = useQuery({
    queryKey: ['adminUsersList'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/users', { params: { limit: 200 } });
      return res.data.data || [];
    }
  });
  const teachers = users.filter(u => u.role === 'TEACHER' && u.teacher);
  const students = users.filter(u => u.role === 'STUDENT' && u.student);

  // 2. Fetch Classes
  const { data: classes = [], refetch: refetchClasses } = useQuery({
    queryKey: ['adminClassesList'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/classes');
      return res.data.data || [];
    }
  });

  // 3. Fetch Subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['adminSubjectsList'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/subjects');
      return res.data.data || [];
    }
  });

  // 4. Fetch Teacher Allocations
  const { data: allocations = [], refetch: refetchAllocations } = useQuery({
    queryKey: ['adminTeacherAssignments'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/teacher-assignments');
      return res.data.data || [];
    }
  });

  const handleCreateAllocation = async (e) => {
    e.preventDefault();
    if (!selectedTeacherId || !selectedClassId || !selectedSubjectId) {
      showToast('Please select Teacher, Class, and Subject', 'error');
      return;
    }

    try {
      await apiClient.post('/admin/teacher-assignments', {
        teacherId: selectedTeacherId,
        classId: selectedClassId,
        subjectId: selectedSubjectId
      });
      showToast('Teacher allocated to Class and Subject successfully!', 'success');
      setSelectedTeacherId('');
      setSelectedClassId('');
      setSelectedSubjectId('');
      refetchAllocations();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create allocation', 'error');
    }
  };

  const handleDeleteAllocation = async (id) => {
    try {
      await apiClient.delete(`/admin/teacher-assignments/${id}`);
      showToast('Allocation removed successfully!', 'success');
      refetchAllocations();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete allocation', 'error');
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) {
      showToast('Class name is required', 'error');
      return;
    }

    try {
      await apiClient.post('/admin/classes', {
        name: newClassName.trim(),
        academicYear: newClassAcademicYear
      });
      showToast(`Class "${newClassName}" created successfully!`, 'success');
      setNewClassName('');
      refetchClasses();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create class', 'error');
    }
  };

  const handleReassignStudent = async (e) => {
    e.preventDefault();
    if (!reassignStudentId || !reassignTargetClassId) {
      showToast('Please select Student and Target Class', 'error');
      return;
    }

    try {
      await apiClient.put(`/admin/students/${reassignStudentId}/class`, {
        classId: reassignTargetClassId
      });
      showToast('Student reassigned to new class successfully!', 'success');
      setReassignStudentId('');
      setReassignTargetClassId('');
      queryClient.invalidateQueries({ queryKey: ['adminUsersList'] });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reassign student', 'error');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="border-b pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Allocations & Class Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Assign Teachers to Classes & Subjects, create granular Divisions (11th C, 11th D), and manage Student Class Allocations.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('allocations')}
            className={`btn-sm ${activeTab === 'allocations' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Teacher Allocations
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`btn-sm ${activeTab === 'classes' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Manage Classes ({classes.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`btn-sm ${activeTab === 'students' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Student Reassignment
          </button>
        </div>
      </div>

      {/* TAB 1: TEACHER ALLOCATIONS */}
      {activeTab === 'allocations' && (
        <div className="space-y-8">
          {/* Allocation Form */}
          <form onSubmit={handleCreateAllocation} className="card bg-blue-50/50 border border-blue-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-blue-950 uppercase tracking-wider">
              Allocate Teacher ➔ Subject ➔ Class / Division
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="input-label">Teacher</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="input-field bg-white"
                  required
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(t => (
                    <option key={t.teacher?.id} value={t.teacher?.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="input-field bg-white"
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">Class / Division</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="input-field bg-white"
                  required
                >
                  <option value="">Select Class / Division</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.academicYear})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" className="btn-primary">
                Add Allocation
              </button>
            </div>
          </form>

          {/* Current Allocations Table */}
          <div className="card space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Active Teacher Allocations ({allocations.length})</h3>

            {allocations.length === 0 ? (
              <p className="py-6 text-center text-gray-500">No teacher allocations configured yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-700 uppercase">
                      <th className="p-3">Teacher</th>
                      <th className="p-3">Assigned Subject</th>
                      <th className="p-3">Assigned Class / Division</th>
                      <th className="p-3">Academic Year</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {allocations.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-semibold text-gray-900">{a.teacher?.user?.name}</div>
                          <div className="text-xs text-gray-500">{a.teacher?.user?.email}</div>
                        </td>
                        <td className="p-3 font-medium text-blue-800">{a.subject?.name}</td>
                        <td className="p-3">
                          <span className="badge badge-info">{a.class?.name}</span>
                        </td>
                        <td className="p-3 text-xs text-gray-600">{a.class?.academicYear}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteAllocation(a.id)}
                            className="text-xs text-red-600 hover:text-red-900 font-bold"
                          >
                            Remove Allocation
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE CLASSES */}
      {activeTab === 'classes' && (
        <div className="space-y-8">
          <form onSubmit={handleCreateClass} className="card p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wider">Create New Class / Division</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Class Name (e.g. 11th C, 11th D, 12th Science)</label>
                <input
                  type="text"
                  placeholder="e.g. 11th C"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="input-label">Academic Year</label>
                <input
                  type="text"
                  value={newClassAcademicYear}
                  onChange={(e) => setNewClassAcademicYear(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary min-w-36">
              Create Class
            </button>
          </form>

          <div className="card space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">All Classes & Divisions ({classes.length})</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {classes.map(c => (
                <div key={c.id} className="border rounded-lg p-4 bg-gray-50/50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-base text-gray-900">{c.name}</span>
                    <span className="text-xs text-gray-500">{c.academicYear}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Enrolled Students: <strong>{c.students?.length || 0}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT REASSIGNMENT */}
      {activeTab === 'students' && (
        <div className="card space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Reassign Student to Another Class</h2>

          <form onSubmit={handleReassignStudent} className="space-y-4 max-w-xl">
            <div>
              <label className="input-label">Select Student</label>
              <select
                value={reassignStudentId}
                onChange={(e) => setReassignStudentId(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select Student</option>
                {students.map(s => (
                  <option key={s.student?.id} value={s.student?.id}>
                    {s.name} ({s.student?.uniqueId || s.email}) — Current Class: {s.student?.class?.name || 'Unassigned'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="input-label">Target Class / Division</label>
              <select
                value={reassignTargetClassId}
                onChange={(e) => setReassignTargetClassId(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select New Class</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.academicYear})</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn-primary">
              Reassign Student
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
