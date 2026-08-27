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

    const result = await login(data.email, data.password);

    if (result.success) {
      // Redirect based on role
      if (result.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (result.user.role === 'TEACHER') {
        navigate('/dashboard');
      } else {
        navigate('/student/papers');
      }
    } else {
      showToast(result.error, 'error');
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
          <p className="auth-eyebrow">Question paper generator</p>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to build, manage, and review question papers.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div>
              <label className="auth-label">Email</label>
              <input
                type="email"
                {...register('email')}
                className="input-field mt-2 w-full"
                placeholder="teacher@school.com"
              />
              {errors.email && <p className="form-error mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="auth-label">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-purple-700 hover:text-purple-900"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                {...register('password')}
                className="input-field mt-2 w-full"
                placeholder="••••••••"
              />
              {errors.password && <p className="form-error mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-2 min-h-11 w-full"
            >
              {loading ? (
                <>
                  <span className="spinner mr-2"></span>
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">Register</Link>
          </p>

          <div className="mt-8 border-t border-slate-200 pt-5 text-center text-sm text-slate-500">
            <p className="font-semibold text-slate-700">Demo credentials</p>
            <p className="mt-3 font-mono text-xs leading-5">
              Email: teacher@school.com<br />
              Password: teacher123
            </p>
            <p className="my-2 text-xs uppercase tracking-wider text-slate-400">or</p>
            <p className="font-mono text-xs leading-5">
              Email: admin@school.com<br />
              Password: admin123
            </p>
          </div>
        </div>
      </div>

      {showForgotModal && <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />}
    </div>
  );
}
