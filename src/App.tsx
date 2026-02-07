import { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { ProtectedRoute } from './components/elements/ProtectedRoute';
import { useAuthSync } from './hooks/useAuthSync';
import { useTokenRefresh } from './hooks/useTokenRefresh';
import { webSocketService } from './backend/services/WebSocketService';
import { SKAFTIN_CONFIG } from './config/skaftin.config';
import { Landing } from './pages/Landing';
import { Login } from '@pages/auth/Login';
import { Register } from '@pages/auth/Register';
import { VerifyOtp } from '@pages/auth/VerifyOtp';
import { ForgotPassword } from '@pages/auth/ForgotPassword';
import { VerifyForgotPasswordOtp } from '@pages/auth/VerifyForgotPasswordOtp';
import { ResetPassword } from '@pages/auth/ResetPassword';
import { Onboard } from '@pages/admin/Onboard';
import { DashboardPage } from '@pages/admin/DashboardPage';
import { InvoiceListPage } from '@pages/admin/InvoiceListPage';
import { InvoiceDetailPage } from '@pages/admin/InvoiceDetailPage';
import { InvoiceFormPage } from '@pages/admin/InvoiceFormPage';
import { CompaniesPage } from '@/pages/admin/companies/CompaniesPage';
import { CompanyDetailPage } from '@/pages/admin/companies/companyPage/CompanyDetailPage';
import { CompanyFormPage } from '@/pages/admin/companies/CompanyFormPage';
import { ItemsPage } from '@pages/admin/ItemsPage';
import { ItemDetailPage } from '@pages/admin/ItemDetailPage';
import { ItemFormPage } from '@pages/admin/ItemFormPage';
import { QuotationListPage } from '@pages/admin/QuotationListPage';
import { QuotationDetailPage } from '@pages/admin/QuotationDetailPage';
import { QuotationFormPage } from '@pages/admin/QuotationFormPage';
import { StatementsPage } from '@pages/admin/StatementsPage';
import { PaymentsPage } from '@pages/admin/PaymentsPage';
import { PaymentFormPage } from '@pages/admin/PaymentFormPage';
import { SettingsPage } from '@/pages/admin/settings/SettingsPage';
import { BusinessSettingsTab, BankingSettingsTab, PreferencesSettingsTab } from '@pages/admin/settings/tabs';
import './App.css';
import { AppLayout } from './layouts/AppLayout';

/**
 * Auth and WebSocket hooks wrapper component
 * Activates multi-tab sync, proactive token refresh, and WebSocket connection
 */
function AuthHooks() {
  useAuthSync();
  useTokenRefresh();

  // Initialize WebSocket and join project room
  useEffect(() => {
    webSocketService.init();

    // Join project room if project ID is configured
    const projectId = SKAFTIN_CONFIG.projectId;
    if (projectId) {
      webSocketService.joinProject(projectId);
    }

    return () => {
      webSocketService.disconnect();
    };
  }, []);

  return null;
}

/**
 * Unauthorized page component
 */
function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">403</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          You don't have permission to access this page.
        </p>
        <a
          href="/app/dashboard"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider verifyOnMount={true}>
      <AuthHooks />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/verify" element={<VerifyForgotPasswordOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        
        {/* Onboarding - requires auth but no role check */}
        <Route path="/onboard" element={<ProtectedRoute><Onboard /></ProtectedRoute>} />
        
        {/* Protected app routes */}
        <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="companies" element={<Outlet />}>
            <Route index element={<CompaniesPage />} />
            <Route path="create" element={<CompanyFormPage />} />
            <Route path=":id" element={<CompanyDetailPage />} />
            <Route path=":id/edit" element={<CompanyFormPage />} />
          </Route>
          <Route path="invoices" element={<Outlet />}>
            <Route index element={<InvoiceListPage />} />
            <Route path="create" element={<InvoiceFormPage />} />
            <Route path=":id" element={<InvoiceDetailPage />} />
            <Route path=":id/edit" element={<InvoiceFormPage />} />
          </Route>
          <Route path="items" element={<Outlet />}>
            <Route index element={<ItemsPage />} />
            <Route path="create" element={<ItemFormPage />} />
            <Route path=":id" element={<ItemDetailPage />} />
            <Route path=":id/edit" element={<ItemFormPage />} />
          </Route>
          <Route path="quotations" element={<Outlet />}>
            <Route index element={<QuotationListPage />} />
            <Route path="create" element={<QuotationFormPage />} />
            <Route path=":id" element={<QuotationDetailPage />} />
            <Route path=":id/edit" element={<QuotationFormPage />} />
          </Route>
          <Route path="payments" element={<Outlet />}>
            <Route index element={<PaymentsPage />} />
            <Route path="create" element={<PaymentFormPage />} />
          </Route>
          <Route path="statements" element={<StatementsPage />} />
          <Route path="settings" element={<SettingsPage />}>
            <Route index element={<BusinessSettingsTab />} />
            <Route path="banking" element={<BankingSettingsTab />} />
            <Route path="preferences" element={<PreferencesSettingsTab />} />
          </Route>
        </Route>
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
