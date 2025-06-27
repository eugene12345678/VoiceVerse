import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useAuthStore } from './store/authStore';
import { firebaseApp } from './lib/firebase'; // Import Firebase app
import { ToastContainer } from './components/ui/Toast';
import { HomePage } from './pages/HomePage';
import { StudioPage } from './pages/StudioPage';
import { FeedPage } from './pages/FeedPage';
import { ProfilePage } from './pages/ProfilePage';
import { ChallengePage } from './pages/ChallengePage';
import { MarketplacePage } from './pages/MarketplacePage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { ContactPage } from './pages/ContactPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { Layout } from './components/common/Layout';
import { IntroLoader } from './components/IntroLoader';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { initializeTheme } from './store/themeStore';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { BlogPage } from './pages/BlogPage';
import { AboutPage } from './pages/AboutPage';
import { TeamPage } from './pages/TeamPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { HelpCenterPage } from './pages/HelpCenterPage';
import { CommunityPage } from './pages/CommunityPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { ApiReferencePage } from './pages/ApiReferencePage';
import { CookiesPage } from './pages/CookiesPage';
import { VoicesPage } from './pages/VoicesPage';


// Initialize theme on app load
initializeTheme();

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function App() {
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const checkAuth = useAuthStore(state => state.checkAuth);
  
  useEffect(() => {
    // Check authentication status when app loads
    checkAuth();
  }, [checkAuth]);
  
  const handleIntroComplete = () => {
    setIsIntroComplete(true);
  };

  // Show intro loader every time
  if (!isIntroComplete) {
    return <IntroLoader onComplete={handleIntroComplete} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          
          {/* All other routes with layout */}
          <Route element={<Layout />}>
            {/* Public routes */}
            <Route index element={<HomePage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="blog" element={<BlogPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="help" element={<HelpCenterPage />} />
            <Route path="community" element={<CommunityPage />} />
            <Route path="documentation" element={<DocumentationPage />} />
            <Route path="api" element={<ApiReferencePage />} />
            <Route path="cookies" element={<CookiesPage />} />
            <Route path="voices" element={<VoicesPage />} />

            {/* Protected routes */}
            <Route path="studio" element={
              <ProtectedRoute>
                <StudioPage />
              </ProtectedRoute>
            } />
            <Route path="feed" element={
              <ProtectedRoute>
                <FeedPage />
              </ProtectedRoute>
            } />
            <Route path="profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="challenges" element={
              <ProtectedRoute>
                <ChallengePage />
              </ProtectedRoute>
            } />
            <Route path="marketplace" element={
              <ProtectedRoute>
                <MarketplacePage />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="subscription" element={
              <ProtectedRoute>
                <SubscriptionPage />
              </ProtectedRoute>
            } />
            <Route path="checkout" element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
      <ToastContainer />
    </QueryClientProvider>
  );
}

export default App;