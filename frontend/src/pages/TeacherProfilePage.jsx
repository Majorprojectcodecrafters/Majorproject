import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { useToast } from '../contexts/ToastContext';

export default function TeacherProfilePage() {
  const { showToast } = useToast();
  const [education, setEducation] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [saving, setSaving] = useState(false);

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['teacherProfilePage'],
    queryFn: async () => {
      const res = await apiClient.get('/teacher/profile');
      return res.data.data || null;
    }
  });

  useEffect(() => {
    if (profile) {
      setEducation(profile.education || '');
      setExperienceYears(profile.experienceYears || 0);
    }
  }, [profile]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.put('/teacher/profile', {
        education,
        experienceYears: Number(experienceYears)
      });
      showToast('Profile updated successfully!', 'success');
      refetch();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8 max-w-4xl text-center text-gray-500">Loading profile...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-600">View and update your teacher account details.</p>
      </div>

      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Info Card */}
          <div className="card space-y-4 md:col-span-1 border-t-4 border-blue-600">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-800 font-bold text-2xl flex items-center justify-center mx-auto">
              {profile.user?.name?.charAt(0) || 'T'}
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-900">{profile.user?.name}</h2>
              <p className="text-xs text-gray-500">{profile.user?.email}</p>
              <span className="badge badge-info mt-2">TEACHER</span>
            </div>

            <div className="border-t pt-3 text-xs space-y-2 text-gray-600">
              <div><strong>Joined:</strong> {new Date(profile.createdAt).toLocaleDateString()}</div>
              <div><strong>Created QPs:</strong> {profile.questionPapers?.length || 0} Papers</div>
              <div><strong>Students:</strong> {profile.students?.length || 0} Assigned</div>
            </div>
          </div>

          {/* Form Card */}
          <form onSubmit={handleUpdate} className="card space-y-6 md:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Profile Details</h3>

            <div>
              <label className="input-label">Full Name</label>
              <input type="text" value={profile.user?.name || ''} disabled className="input-field bg-gray-100 cursor-not-allowed" />
            </div>

            <div>
              <label className="input-label">Email Address</label>
              <input type="email" value={profile.user?.email || ''} disabled className="input-field bg-gray-100 cursor-not-allowed" />
            </div>

            <div>
              <label className="input-label">Education Qualifications</label>
              <input
                type="text"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="e.g. M.Sc Physics, B.Ed"
                className="input-field"
              />
            </div>

            <div>
              <label className="input-label">Teaching Experience (Years)</label>
              <input
                type="number"
                min="0"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="input-field"
              />
            </div>

            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
