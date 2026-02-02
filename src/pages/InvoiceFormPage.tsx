import { useParams, useNavigate } from 'react-router-dom';
import { InvoiceForm } from '../components/InvoiceForm';

export function InvoiceFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const invoiceId = id ? parseInt(id, 10) : undefined;

  return (
    <InvoiceForm
      invoiceId={invoiceId}
      onSuccess={() => navigate('/app/invoices')}
      onCancel={() =>
        invoiceId ? navigate(`/app/invoices/${invoiceId}`) : navigate('/app/invoices')
      }
    />
  );
}
