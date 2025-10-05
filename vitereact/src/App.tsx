import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';

/* Import views */
import GV_TopNav from '@/components/views/GV_TopNav.tsx';
import GV_Footer from '@/components/views/GV_Footer.tsx';
import UV_LandingPage from '@/components/views/UV_LandingPage.tsx';
import UV_SignUp from '@/components/views/UV_SignUp.tsx';
import UV_Login from '@/components/views/UV_Login.tsx';
import UV_PasswordRecovery from '@/components/views/UV_PasswordRecovery.tsx';
import UV_Dashboard from '@/components/views/UV_Dashboard.tsx';
import UV_PortfolioBuilder from '@/components/views/UV_PortfolioBuilder.tsx';
import UV_PortfolioPreview from '@/components/views/UV_PortfolioPreview.tsx';
import UV_Analytics from '@/components/views/UV_Analytics.tsx';
import UV_AccountSettings from '@/components/views/UV_AccountSettings.tsx';
import UV_TemplateOverview from '@/components/views/UV_TemplateOverview.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// ProtectedRoute component for guarding routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const isLoading = useAppStore(state => state.authentication_state.authentication_status.is_loading);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const isLoading = useAppStore(state => state.authentication_state.authentication_status.is_loading);
  const initializeAuth = useAppStore(state => state.initialize_auth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <div className="App min-h-screen flex flex-col">
          <GV_TopNav />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<UV_LandingPage />} />
              <Route path="/signup" element={<UV_SignUp />} />
              <Route path="/login" element={<UV_Login />} />
              <Route path="/password-recovery" element={<UV_PasswordRecovery />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <UV_Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/portfolio/builder"
                element={
                  <ProtectedRoute>
                    <UV_PortfolioBuilder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/portfolio/preview"
                element={
                  <ProtectedRoute>
                    <UV_PortfolioPreview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <UV_Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account-settings"
                element={
                  <ProtectedRoute>
                    <UV_AccountSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/templates"
                element={
                  <ProtectedRoute>
                    <UV_TemplateOverview />
                  </ProtectedRoute>
                }
              />

              {/* Catch all - redirect based on auth status */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
          <GV_Footer />
        </div>
      </QueryClientProvider>
    </Router>
  );
};

export default App;