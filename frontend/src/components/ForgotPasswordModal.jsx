import { useState, useEffect } from 'react';
import apiClient from '../lib/api';
import { useToast } from '../contexts/ToastContext';

export default function ForgotPasswordModal({ onClose }) {
  const { showToast } = useToast();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for 30s OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return setErrorMsg('Please enter your email address');

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await apiClient.post('/auth/forgot-password', { email });
      if (res.data.success) {
        showToast(res.data.message, 'success');
        setOtp('');
        setResendCooldown(30);
        setStep(2);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to send OTP email');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP (30s cooldown)
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await apiClient.post('/auth/forgot-password', { email });
      if (res.data.success) {
        showToast('A new 6-digit OTP code has been sent to your email.', 'success');
        setOtp('');
        setResendCooldown(30);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to resend OTP email');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 6-digit OTP Code
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) return setErrorMsg('Please enter a valid 6-digit OTP code');

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await apiClient.post('/auth/verify-otp', { email, otp });
      if (res.data.success) {
        showToast('OTP verified! Please set your new password.', 'success');
        setStep(3);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Invalid or expired OTP code');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) return setErrorMsg('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return setErrorMsg('Passwords do not match');

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await apiClient.post('/auth/reset-password', { email, otp, newPassword });
      if (res.data.success) {
        showToast('Password changed successfully!', 'success');
        setStep(4);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b pb-3 mb-5">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-slate-900">Forgot Password</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Step 1: Request Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <p className="text-sm text-slate-600">
              Enter your registered Gmail address. We will send a 6-digit OTP code to verify your identity.
            </p>

            <div>
              <label className="auth-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.com"
                required
                className="input-field mt-1.5 w-full"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 font-bold text-sm"
            >
              {loading ? <><span className="spinner mr-2"></span>Sending OTP Email...</> : 'Send 6-Digit OTP'}
            </button>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-slate-600">
              An email containing a 6-digit OTP code has been sent to <strong>{email}</strong>. (Valid for 10 minutes)
            </p>

            <div>
              <label className="auth-label">Enter 6-Digit OTP Code</label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="------"
                required
                className="input-field mt-1.5 w-full text-center text-2xl tracking-widest font-mono font-bold border-blue-400 focus:border-blue-600"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <span className="text-slate-500">Didn't receive code?</span>
              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={handleResendOtp}
                className={`font-bold transition-colors ${
                  resendCooldown > 0
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-blue-600 hover:text-blue-800 underline'
                }`}
              >
                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-secondary w-1/3 py-2.5 text-xs font-bold"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="btn-primary w-2/3 py-2.5 font-bold text-sm"
              >
                {loading ? <><span className="spinner mr-2"></span>Verifying...</> : '✓ Verify OTP'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Set New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-slate-600">
              OTP Verified! Please enter your new password.
            </p>

            <div>
              <label className="auth-label">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                className="input-field mt-1.5 w-full"
              />
            </div>

            <div>
              <label className="auth-label">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
                className="input-field mt-1.5 w-full"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 font-bold text-sm"
            >
              {loading ? <><span className="spinner mr-2"></span>Resetting Password...</> : ' Reset Password'}
            </button>
          </form>
        )}

        {/* Step 4: Success Confirmation */}
        {step === 4 && (
          <div className="text-center py-4 space-y-4">
            <h4 className="text-lg font-bold text-slate-900">Password Reset Successful!</h4>
            <p className="text-xs text-slate-600">
              Your password has been changed successfully. You can now sign in with your new credentials.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="btn-primary w-full py-2.5 font-bold text-sm"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
