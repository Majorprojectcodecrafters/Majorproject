import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { useToast } from '../contexts/ToastContext';

export default function StudentProfilePage() {
  const { showToast } = useToast();
  const [contact, setContact] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['studentProfilePage'],
    queryFn: async () => {
      const res = await apiClient.get('/student/profile');
      return res.data.data || null;
    }
  });

  useEffect(() => {
    if (profile) {
      setContact(profile.contact || '');
    }
  }, [profile]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.put('/student/profile', { contact });
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
        <h1 className="text-3xl font-bold text-gray-900">My Student Profile</h1>
        <p className="mt-1 text-sm text-gray-600">View your class enrollment and account details.</p>
      </div>

      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Info Card */}
          <div className="card space-y-4 md:col-span-1 border-t-4 border-emerald-600">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 font-bold text-2xl flex items-center justify-center mx-auto">
              {profile.user?.name?.charAt(0) || 'S'}
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-900">{profile.user?.name}</h2>
              <p className="text-xs text-gray-500">{profile.user?.email}</p>
              <span className="badge badge-success mt-2">STUDENT</span>
            </div>

            <div className="border-t pt-3 text-xs space-y-2 text-gray-600">
              <div><strong>Student ID:</strong> {profile.uniqueId}</div>
              <div><strong>Class:</strong> {profile.class?.name || 'N/A'}</div>
              <div><strong>Stream:</strong> {profile.stream?.name || 'N/A'}</div>
            </div>
          </div>

          {/* Form Card */}
          <form onSubmit={handleUpdate} className="card space-y-6 md:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Account Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Student Name</label>
                <input type="text" value={profile.user?.name || ''} disabled className="input-field bg-gray-100 cursor-not-allowed" />
              </div>
              <div>
                <label className="input-label">Student Unique ID</label>
                <input type="text" value={profile.uniqueId || ''} disabled className="input-field bg-gray-100 cursor-not-allowed font-mono" />
              </div>
            </div>

            <div>
              <label className="input-label">Email Address</label>
              <input type="email" value={profile.user?.email || ''} disabled className="input-field bg-gray-100 cursor-not-allowed" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Assigned Class / Division</label>
                <input type="text" value={profile.class?.name || ''} disabled className="input-field bg-gray-100 cursor-not-allowed" />
              </div>
              <div>
                <label className="input-label">Academic Stream</label>
                <input type="text" value={profile.stream?.name || ''} disabled className="input-field bg-gray-100 cursor-not-allowed" />
              </div>
            </div>

            <div>
              <label className="input-label">Contact Phone Number</label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Enter phone number"
                className="input-field"
              />
            </div>

            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Update Contact Info'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
