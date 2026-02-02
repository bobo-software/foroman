import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Onboard } from './pages/Onboard';
import { AppLayout } from './layouts/AppLayout';
import { InvoiceListPage } from './pages/InvoiceListPage';
import { InvoiceDetailPage } from './pages/InvoiceDetailPage';
import { InvoiceFormPage } from './pages/InvoiceFormPage';
import { ItemsPage } from './pages/ItemsPage';
import { QuotationsPage } from './pages/QuotationsPage';
import { StatementsPage } from './pages/StatementsPage';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/onboard" element={<ProtectedRoute><Onboard /></ProtectedRoute>} />
      <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/app/invoices" replace />} />
        <Route path="invoices" element={<Outlet />}>
          {/* Nested invoice routes */}
          <Route index element={<InvoiceListPage />} />
          <Route path="create" element={<InvoiceFormPage />} />
          <Route path=":id" element={<InvoiceDetailPage />} />
          <Route path=":id/edit" element={<InvoiceFormPage />} />
        </Route>
        <Route path="items" element={<ItemsPage />} />
        <Route path="quotations" element={<QuotationsPage />} />
        <Route path="statements" element={<StatementsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
