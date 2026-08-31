import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

export default function StudentProfilePage() {
  const { showToast } = useToast();
  const { user, updateUser } = useAuth();
  const [contact, setContact] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, JPEG)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Profile image size must be under 5MB', 'error');
      return;
    }

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Url = reader.result;
        await apiClient.post('/auth/avatar', { avatarUrl: base64Url });
        updateUser({ avatarUrl: base64Url });
        showToast('Profile photo updated successfully!', 'success');
        refetch();
      };
      reader.readAsDataURL(file);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to upload photo', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    try {
      await apiClient.delete('/auth/avatar');
      updateUser({ avatarUrl: null });
      showToast('Profile photo removed', 'success');
      refetch();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove photo', 'error');
    }
  };

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

  const currentAvatar = user?.avatarUrl || profile?.user?.avatarUrl;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8 select-none">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">My Student Profile</h1>
        <p className="mt-1 text-sm text-gray-600">View your class enrollment and account details.</p>
      </div>

      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Info Card */}
          <div className="card space-y-5 md:col-span-1 border-t-4 border-emerald-600 text-center">
            {/* Circular Profile Avatar with Blue Ring */}
            <div className="relative group w-24 h-24 mx-auto">
              <div className="w-24 h-24 rounded-full border-4 border-blue-500 p-0.5 shadow-md overflow-hidden bg-slate-100 flex items-center justify-center">
                {currentAvatar ? (
                  <img src={currentAvatar} alt={profile.user?.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-emerald-600 text-white font-black text-3xl flex items-center justify-center uppercase">
                    {profile.user?.name?.charAt(0) || 'S'}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Photo Customization Controls */}
            <div className="space-y-2 pt-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="btn-secondary py-1.5 px-4 text-xs font-bold w-full rounded-xl flex items-center justify-center gap-1.5"
              >
                <span>📷</span>
                <span>{uploadingPhoto ? 'Uploading...' : currentAvatar ? 'Change Photo' : 'Upload Photo'}</span>
              </button>

              {currentAvatar && (
                <button
                  type="button"
                  onClick={handleDeletePhoto}
                  className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline w-full text-center block pt-1"
                >
                  Remove Photo
                </button>
              )}
            </div>

            <div className="text-center pt-2">
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
