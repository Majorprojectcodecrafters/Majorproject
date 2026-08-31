import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function TeacherProfilePage() {
  const { showToast } = useToast();
  const { user, updateUser, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('myProfileTitle', 'My Profile')}</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">{t('myProfileSubtitle', 'View and update your teacher account details.')}</p>
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
                <span>{uploadingPhoto ? t('uploading', 'Uploading...') : currentAvatar ? t('changePhoto', 'Change Photo') : t('uploadPhoto', 'Upload Photo')}</span>
              </button>

              {currentAvatar && (
                <button
                  type="button"
                  onClick={handleDeletePhoto}
                  className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline w-full text-center block pt-1"
                >
                  {t('removePhoto', 'Remove Photo')}
                </button>
              )}
            </div>

            <div className="text-center pt-2">
              <h2 className="text-lg font-bold text-slate-900">{profile.user?.name}</h2>
              <p className="text-xs text-slate-500 font-medium">{profile.user?.email}</p>
              <span className="badge badge-info mt-2">TEACHER</span>
            </div>

            <div className="border-t border-slate-100 pt-3 text-xs space-y-2 text-slate-600 text-left">
              <div><strong>{t('joinedLabel', 'Joined')}:</strong> {new Date(profile.createdAt).toLocaleDateString()}</div>
              <div><strong>{t('createdQPsLabel', 'Created QPs')}:</strong> {profile.questionPapers?.length || 0} {t('papersWord', 'Papers')}</div>
              <div><strong>{t('studentsLabel', 'Students')}:</strong> {profile.students?.length || 0} {t('assignedWord', 'Assigned')}</div>
            </div>

            {/* Logout Action inside Profile Section */}
            <div className="border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <span>{t('logoutFromAccount', 'Logout from Account')}</span>
              </button>
            </div>
          </div>

          {/* Form Card & Language Settings */}
          <div className="space-y-6 md:col-span-2">
            <form onSubmit={handleUpdate} className="card space-y-6">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">{t('profileDetails', 'Profile Details')}</h3>

              <div>
                <label className="input-label font-bold text-xs text-slate-700">{t('fullName', 'Full Name')}</label>
                <input type="text" value={profile.user?.name || ''} disabled className="input-field bg-slate-100 cursor-not-allowed mt-1" />
              </div>

              <div>
                <label className="input-label font-bold text-xs text-slate-700">{t('emailAddress', 'Email Address')}</label>
                <input type="email" value={profile.user?.email || ''} disabled className="input-field bg-slate-100 cursor-not-allowed mt-1" />
              </div>

              <div>
                <label className="input-label font-bold text-xs text-slate-700">{t('educationQualifications', 'Education Qualifications')}</label>
                <input
                  type="text"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="e.g. M.Sc Physics, B.Ed"
                  className="input-field mt-1"
                />
              </div>

              <div>
                <label className="input-label font-bold text-xs text-slate-700">{t('teachingExperience', 'Teaching Experience (Years)')}</label>
                <input
                  type="number"
                  min="0"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="input-field mt-1"
                />
              </div>

              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : t('updateProfile', 'Update Profile')}
              </button>
            </form>

            {/* Language Settings Card */}
            <div className="card space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">{t('languageSettings', 'Language Settings')}</h3>
              <p className="text-xs text-slate-500 font-medium">{t('selectLanguage', 'Select your preferred language for the QPGen interface:')}</p>
              
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setLanguage('en');
                    showToast(t('languageSavedToast', 'UI Language updated successfully!'), 'success');
                  }}
                  className={`py-3 px-4 rounded-xl border text-xs font-extrabold text-center transition-all ${language === 'en' ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  English
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLanguage('hi');
                    showToast(t('languageSavedToast', 'UI Language updated successfully!'), 'success');
                  }}
                  className={`py-3 px-4 rounded-xl border text-xs font-extrabold text-center transition-all ${language === 'hi' ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  हिंदी (Hindi)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLanguage('mr');
                    showToast(t('languageSavedToast', 'UI Language updated successfully!'), 'success');
                  }}
                  className={`py-3 px-4 rounded-xl border text-xs font-extrabold text-center transition-all ${language === 'mr' ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  मराठी (Marathi)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
