import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function AdminProfilePage() {
  const { showToast } = useToast();
  const { user, updateUser, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
      };
      reader.readAsDataURL(file);
    } catch (err) {
      showToast('Failed to upload profile photo', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    try {
      await apiClient.delete('/auth/avatar');
      updateUser({ avatarUrl: null });
      showToast('Profile photo removed successfully!', 'success');
    } catch (err) {
      showToast('Failed to remove photo', 'error');
    }
  };

  const currentAvatar = user?.avatarUrl;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('myProfileTitle', 'My Profile')}</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">
          {t('myProfileSubtitle', 'View and update your administrator account details & preferences.')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Avatar & Summary Card */}
        <div className="card space-y-4 text-center shadow-sm border border-slate-200">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full border-4 border-purple-600 p-0.5 shadow-md overflow-hidden bg-slate-100 flex items-center justify-center">
              {currentAvatar ? (
                <img src={currentAvatar} alt={user?.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-purple-700 text-white font-black text-3xl flex items-center justify-center uppercase">
                  {user?.name?.charAt(0) || 'A'}
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
            <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-500 font-medium">{user?.email}</p>
            <span className="badge badge-info mt-2 bg-purple-100 text-purple-800 border-purple-200">ADMINISTRATOR</span>
          </div>

          {/* Logout Action inside Profile Section */}
          <div className="border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <span>{t('logoutFromAccount', 'Logout from Account')}</span>
            </button>
          </div>
        </div>

        {/* Right Side: Account Details & Language Settings */}
        <div className="space-y-6 md:col-span-2">
          <div className="card space-y-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">{t('profileDetails', 'Profile Details')}</h3>

            <div>
              <label className="input-label font-bold text-xs text-slate-700">{t('fullName', 'Full Name')}</label>
              <input type="text" value={user?.name || ''} disabled className="input-field bg-slate-100 cursor-not-allowed mt-1" />
            </div>

            <div>
              <label className="input-label font-bold text-xs text-slate-700">{t('emailAddress', 'Email Address')}</label>
              <input type="email" value={user?.email || ''} disabled className="input-field bg-slate-100 cursor-not-allowed mt-1" />
            </div>

            <div>
              <label className="input-label font-bold text-xs text-slate-700">Role & Access Level</label>
              <input type="text" value="System Administrator" disabled className="input-field bg-slate-100 cursor-not-allowed mt-1 font-semibold text-purple-900" />
            </div>
          </div>

          {/* Language Settings Card inside Profile */}
          <div className="card space-y-4 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">{t('languageSettingsCardTitle', 'Language Preferences & Settings')}</h3>
            <p className="text-xs text-slate-500 font-medium">{t('selectLanguageDesc', 'Choose your preferred interface display language for the QPGen application:')}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setLanguage('en');
                  showToast(t('languageSavedToast', 'UI Language updated successfully!'), 'success');
                }}
                className={`py-3 px-4 rounded-xl border text-xs font-extrabold text-center transition-all ${language === 'en' ? 'bg-purple-50 border-purple-600 text-purple-700 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                {t('englishLanguage', 'English (US)')}
              </button>

              <button
                type="button"
                onClick={() => {
                  setLanguage('hi');
                  showToast(t('languageSavedToast', 'UI Language updated successfully!'), 'success');
                }}
                className={`py-3 px-4 rounded-xl border text-xs font-extrabold text-center transition-all ${language === 'hi' ? 'bg-purple-50 border-purple-600 text-purple-700 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                {t('hindiLanguage', 'हिंदी (Hindi)')}
              </button>

              <button
                type="button"
                onClick={() => {
                  setLanguage('mr');
                  showToast(t('languageSavedToast', 'UI Language updated successfully!'), 'success');
                }}
                className={`py-3 px-4 rounded-xl border text-xs font-extrabold text-center transition-all ${language === 'mr' ? 'bg-purple-50 border-purple-600 text-purple-700 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                {t('marathiLanguage', 'मराठी (Marathi)')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
