import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Login } from '@pages/auth/Login';
import { Register } from '@pages/auth/Register';
import { VerifyOtp } from '@pages/auth/VerifyOtp';
import { Onboard } from '@pages/admin/Onboard';
import { DashboardPage } from '@pages/admin/DashboardPage';
import { InvoiceListPage } from '@pages/admin/InvoiceListPage';
import { InvoiceDetailPage } from '@pages/admin/InvoiceDetailPage';
import { InvoiceFormPage } from '@pages/admin/InvoiceFormPage';
import { CustomersPage } from '@pages/admin/CustomersPage';
import { CustomerDetailPage } from '@pages/admin/CustomerDetailPage';
import { CustomerFormPage } from '@pages/admin/CustomerFormPage';
import { ItemsPage } from '@pages/admin/ItemsPage';
import { ItemDetailPage } from '@pages/admin/ItemDetailPage';
import { ItemFormPage } from '@pages/admin/ItemFormPage';
import { QuotationsPage } from '@pages/admin/QuotationsPage';
import { StatementsPage } from '@pages/admin/StatementsPage';
import './App.css';
import { AppLayout } from './layouts/AppLayout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/onboard" element={<Onboard />} />
      <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="customers" element={<Outlet />}>
          <Route index element={<CustomersPage />} />
          <Route path="create" element={<CustomerFormPage />} />
          <Route path=":id" element={<CustomerDetailPage />} />
        </Route>
        <Route path="invoices" element={<Outlet />}>
          {/* Nested invoice routes */}
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
        <Route path="quotations" element={<QuotationsPage />} />
        <Route path="statements" element={<StatementsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
