import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../lib/schemas';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Logo from '../components/Logo';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setAuthError('');

    const result = await login(data.email, data.password, Boolean(data.rememberMe));

    if (result.success) {
      if (result.user.role === 'ADMIN' || result.user.role === 'DEVELOPER') {
        navigate('/admin/dashboard');
      } else if (result.user.role === 'TEACHER') {
        navigate('/dashboard');
      } else {
        navigate('/student/papers');
      }
    } else {
      const errorMsg = result.error || 'Invalid email or password';
      setAuthError(errorMsg);
      showToast(errorMsg, 'error');
    }

    setLoading(false);
  };

  return (
    <div className="auth-shell">
      <div className="relative w-full max-w-md">
        <div className="auth-card">
          <div className="mb-6 flex justify-center">
            <Logo variant="large" />
          </div>
          <p className="auth-eyebrow">Academic Portal</p>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to manage and review curriculum, questions, and papers.</p>

          {authError && (
            <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className="auth-label">Email</label>
              <input
                type="email"
                {...register('email')}
                className="input-field mt-1.5 w-full"
                placeholder="name@example.com"
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="auth-label">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                {...register('password')}
                className="input-field mt-1.5 w-full"
                placeholder="••••••••"
              />
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 transition-colors cursor-pointer"
                />
                <span className="ml-2 text-xs text-slate-600 hover:text-slate-900 font-medium">
                  Remember me on this device
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-2 min-h-10 w-full"
            >
              {loading ? (
                <>
                  <span className="spinner mr-2"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">Register</Link>
          </p>
        </div>
      </div>

      {showForgotModal && <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />}
    </div>
  );
}
