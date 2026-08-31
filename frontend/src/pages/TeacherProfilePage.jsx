import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

export default function TeacherProfilePage() {
  const { showToast } = useToast();
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [education, setEducation] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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

  const currentAvatar = user?.avatarUrl || profile?.user?.avatarUrl;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8 select-none">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-600">View and update your teacher account details.</p>
      </div>

      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Info Card */}
          <div className="card space-y-5 md:col-span-1 border-t-4 border-blue-600 text-center">
            {/* Circular Profile Avatar with Blue Ring */}
            <div className="relative group w-24 h-24 mx-auto">
              <div className="w-24 h-24 rounded-full border-4 border-blue-500 p-0.5 shadow-md overflow-hidden bg-slate-100 flex items-center justify-center">
                {currentAvatar ? (
                  <img src={currentAvatar} alt={profile.user?.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-blue-600 text-white font-black text-3xl flex items-center justify-center uppercase">
                    {profile.user?.name?.charAt(0) || 'T'}
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
                <span></span>
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
              <span className="badge badge-info mt-2">TEACHER</span>
            </div>

            <div className="border-t pt-3 text-xs space-y-2 text-gray-600 text-left">
              <div><strong>Joined:</strong> {new Date(profile.createdAt).toLocaleDateString()}</div>
              <div><strong>Created QPs:</strong> {profile.questionPapers?.length || 0} Papers</div>
              <div><strong>Students:</strong> {profile.students?.length || 0} Assigned</div>
            </div>

            {/* Logout Action inside Profile Section */}
            <div className="border-t pt-3">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <span></span>
                <span>Logout from Account</span>
              </button>
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
