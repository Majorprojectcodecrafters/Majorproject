import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import AdminProfilePage from './pages/AdminProfilePage';

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
import TeacherStudentsPage from './pages/TeacherStudentsPage';
import CreateResultPage from './pages/CreateResultPage';
import TeacherQuizPage from './pages/TeacherQuizPage';
import StudentQuizPage from './pages/StudentQuizPage';
import TeacherProfilePage from './pages/TeacherProfilePage';
import StudentProfilePage from './pages/StudentProfilePage';
import AdminAllocationsPage from './pages/AdminAllocationsPage';
import AdminUserManagementPage from './pages/AdminUserManagementPage';
import StudentPracticePage from './pages/StudentPracticePage';
import StudentAnnouncementsPage from './pages/StudentAnnouncementsPage';
import ManageAnnouncementsPage from './pages/ManageAnnouncementsPage';
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

  if (user.role === 'ADMIN' || user.role === 'DEVELOPER') return <Navigate to="/admin/dashboard" replace />;
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
          <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN', 'DEVELOPER']}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/generator"
        element={
          <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN', 'DEVELOPER']}>
            <QPGeneratorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/students"
        element={
          <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN', 'DEVELOPER']}>
            <TeacherStudentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/results/create"
        element={
          <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN', 'DEVELOPER']}>
            <CreateResultPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/quiz"
        element={
          <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN', 'DEVELOPER']}>
            <TeacherQuizPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/profile"
        element={
          <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN', 'DEVELOPER']}>
            <TeacherProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/paper/:paperId"
        element={
          <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN', 'DEVELOPER', 'STUDENT']}>
            <PaperViewerPage />
          </ProtectedRoute>
        }
      />

      {/* Student Routes */}
      <Route
        path="/student/papers"
        element={
          <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN', 'DEVELOPER']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/materials"
        element={
          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN', 'DEVELOPER']}>
            <StudentMaterialsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/library"
        element={
          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN', 'DEVELOPER']}>
            <StudentMaterialsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/results"
        element={
          <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN', 'DEVELOPER']}>
            <StudentResultsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/quizzes"
        element={
          <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN', 'DEVELOPER']}>
            <StudentQuizPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/practice"
        element={
          <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN', 'DEVELOPER']}>
            <StudentPracticePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/announcements"
        element={
          <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN', 'DEVELOPER']}>
            <StudentAnnouncementsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manage/announcements"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'DEVELOPER', 'TEACHER']}>
            <ManageAnnouncementsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN', 'DEVELOPER']}>
            <StudentProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'DEVELOPER']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'DEVELOPER']}>
            <AdminUserManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/allocations"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'DEVELOPER']}>
            <AdminAllocationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/knowledge-base"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'DEVELOPER', 'TEACHER']}>
            <AdminKnowledgeBasePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'DEVELOPER']}>
            <AdminProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
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
          <LanguageProvider>
            <Router>
              <Navbar />
              <AppRoutes />
            </Router>
          </LanguageProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
