import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TeacherDashboard from './pages/TeacherDashboard';
import QPGeneratorPage from './pages/QPGeneratorPage';
import PaperViewerPage from './pages/PaperViewerPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminKnowledgeBasePage from './pages/AdminKnowledgeBasePage';
import StudentDashboard from './pages/StudentDashboard';
import StudentResultsPage from './pages/StudentResultsPage';
import StudentMaterialsPage from './pages/StudentMaterialsPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Sends the logged-in user to the right home page for their role.
// Falls back to /login if not authenticated (ProtectedRoute would do
// this anyway, but this avoids an extra redirect hop).
function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'TEACHER') return <Navigate to="/dashboard" replace />;
  return <Navigate to="/student/papers" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Teacher Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['TEACHER']}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/generator"
        element={
          <ProtectedRoute allowedRoles={['TEACHER']}>
            <QPGeneratorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/paper/:paperId"
        element={
          <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN', 'STUDENT']}>
            <PaperViewerPage />
          </ProtectedRoute>
        }
      />

      {/* Student Routes */}
      <Route
        path="/student/papers"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/materials"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentMaterialsPage />
          </ProtectedRoute>
        }
      />      <Route
        path="/student/results"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentResultsPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/knowledge-base"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
            <AdminKnowledgeBasePage />
          </ProtectedRoute>
        }
      />

      {/* Fallback — routes each role to its own home */}
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <Navbar />
            <AppRoutes />
          </Router>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
