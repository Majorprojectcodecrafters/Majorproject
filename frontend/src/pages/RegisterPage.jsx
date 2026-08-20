import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import apiClient from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Logo from '../components/Logo';

const registerFormSchema = z.object({
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT']),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  dob: z.string().min(1, 'Date of birth is required'),
  education: z.string().optional(),
  experienceYears: z.number().min(0, 'Experience cannot be negative').optional(),
  uniqueId: z.string().optional(),
  contact: z.string().optional(),
  classId: z.string().optional(),
  streamId: z.string().optional(),
}).superRefine((values, context) => {
  if (values.password !== values.confirmPassword) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmPassword'],
      message: 'Passwords do not match',
    });
  }

  if (values.role === 'STUDENT') {
    for (const field of ['uniqueId', 'contact', 'classId', 'streamId']) {
      if (!values[field]) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: 'This field is required for students',
        });
      }
    }
  }
});

const roleRoutes = {
  ADMIN: '/admin/dashboard',
  TEACHER: '/dashboard',
  STUDENT: '/student/papers',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState('');
  const [classes, setClasses] = useState([]);
  const [streams, setStreams] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      role: 'TEACHER',
      education: '',
      experienceYears: undefined,
      uniqueId: '',
      contact: '',
      classId: '',
      streamId: '',
    },
  });
  const role = watch('role');

  useEffect(() => {
    if (role !== 'STUDENT' || (classes.length > 0 && streams.length > 0)) return;

    let active = true;
    const loadOptions = async () => {
      setOptionsLoading(true);
      setOptionsError('');
      try {
        const [classesResponse, streamsResponse] = await Promise.all([
          apiClient.get('/admin/classes'),
          apiClient.get('/admin/streams'),
        ]);
        if (!active) return;
        setClasses(classesResponse.data.data || []);
        setStreams(streamsResponse.data.data || []);
      } catch (error) {
        if (active) {
          setOptionsError(error.response?.data?.message || 'Unable to load classes and streams');
        }
      } finally {
        if (active) setOptionsLoading(false);
      }
    };

    loadOptions();
    return () => {
      active = false;
    };
  }, [role, classes.length, streams.length]);

  const onSubmit = async (values) => {
    setLoading(true);
    const { confirmPassword, ...registrationData } = values;
    const payload = {
      ...registrationData,
      ...(role === 'TEACHER' && {
        experienceYears: registrationData.experienceYears ?? 0,
      }),
    };

    const result = await registerUser(payload);
    if (result.success) {
      navigate(roleRoutes[result.user.role] || '/login');
    } else {
      showToast(result.error, 'error');
    }
    setLoading(false);
  };

  const fieldError = (name) => errors[name] && (
    <p className="form-error mt-1">{errors[name].message}</p>
  );

  return (
    <div className="auth-shell">
      <div className="relative w-full max-w-xl">
        <div className="auth-card">
          <div className="mb-6 flex justify-center">
            <Logo variant="large" />
          </div>
          <p className="auth-eyebrow">Get started</p>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Set up your profile to start working with QPGen.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div>
              <label className="auth-label">Role</label>
              <select {...register('role')} className="input-field mt-2 w-full">
                <option value="TEACHER">Teacher</option>
                <option value="ADMIN">Admin</option>
                <option value="STUDENT">Student</option>
              </select>
              {fieldError('role')}
            </div>

            <div>
              <label className="auth-label">Name</label>
              <input {...register('name')} className="input-field mt-2 w-full" placeholder="Your full name" />
              {fieldError('name')}
            </div>

            <div>
              <label className="auth-label">Email</label>
              <input type="email" {...register('email')} className="input-field mt-2 w-full" placeholder="you@example.com" />
              {fieldError('email')}
            </div>

            <div>
              <label className="auth-label">Password</label>
              <input type="password" {...register('password')} className="input-field mt-2 w-full" placeholder="At least 6 characters" />
              {fieldError('password')}
            </div>

            <div>
              <label className="auth-label">Confirm password</label>
              <input type="password" {...register('confirmPassword')} className="input-field mt-2 w-full" placeholder="Repeat your password" />
              {fieldError('confirmPassword')}
            </div>

            <div>
              <label className="auth-label">Date of birth</label>
              <input type="date" {...register('dob')} className="input-field mt-2 w-full" />
              {fieldError('dob')}
            </div>

            {role === 'TEACHER' && (
              <>
                <div>
                  <label className="auth-label">Education <span className="font-normal text-slate-400">(optional)</span></label>
                  <input {...register('education')} className="input-field mt-2 w-full" placeholder="e.g. M.Sc Physics, B.Ed" />
                  {fieldError('education')}
                </div>
                <div>
                  <label className="auth-label">Experience years <span className="font-normal text-slate-400">(optional)</span></label>
                  <input
                    type="number"
                    min="0"
                    {...register('experienceYears', {
                      setValueAs: (value) => value === '' ? undefined : Number(value),
                    })}
                    className="input-field mt-2 w-full"
                  />
                  {fieldError('experienceYears')}
                </div>
              </>
            )}

            {role === 'STUDENT' && (
              <>
                <div>
                  <label className="auth-label">Unique ID</label>
                  <input {...register('uniqueId')} className="input-field mt-2 w-full" placeholder="Student ID" />
                  {fieldError('uniqueId')}
                </div>
                <div>
                  <label className="auth-label">Contact</label>
                  <input {...register('contact')} className="input-field mt-2 w-full" placeholder="Phone number" />
                  {fieldError('contact')}
                </div>
                <div>
                  <label className="auth-label">Class</label>
                  <select {...register('classId')} className="input-field mt-2 w-full" disabled={optionsLoading}>
                    <option value="">{optionsLoading ? 'Loading classes...' : 'Select a class'}</option>
                    {classes.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.academicYear})</option>)}
                  </select>
                  {fieldError('classId')}
                </div>
                <div>
                  <label className="auth-label">Stream</label>
                  <select {...register('streamId')} className="input-field mt-2 w-full" disabled={optionsLoading}>
                    <option value="">{optionsLoading ? 'Loading streams...' : 'Select a stream'}</option>
                    {streams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                  {fieldError('streamId')}
                </div>
                {optionsError && <p className="form-error">{optionsError}</p>}
              </>
            )}

            <button type="submit" disabled={loading || optionsLoading} className="btn-primary mt-2 min-h-11 w-full">
              {loading ? (
                <><span className="spinner mr-2"></span>Registering...</>
              ) : 'Register'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
