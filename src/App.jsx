import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import AiIntelligencePage from './pages/AiIntelligencePage';
import QuotationsPage from './pages/QuotationsPage';
import CustomersPage from './pages/CustomersPage';
import FollowUpsPage from './pages/FollowUpsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LostDealsPage from './pages/LostDealsPage';
import TeamPage from './pages/TeamPage';
import IntegrationsPage from './pages/IntegrationsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute requireBusiness={false}>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="ai-intelligence" element={<AiIntelligencePage />} />
            <Route path="quotations" element={<QuotationsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="follow-ups" element={<FollowUpsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="lost-deals" element={<LostDealsPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="subscription" element={<SubscriptionPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
