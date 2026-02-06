import { useNavigate, useSearchParams } from 'react-router-dom';
import { PaymentForm } from '@/components/elements/PaymentForm';

export function PaymentFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyName = searchParams.get('company') ?? undefined;

  return (
    <PaymentForm
      initialCompanyName={companyName}
      onSuccess={() => navigate('/app/payments')}
      onCancel={() => navigate('/app/payments')}
    />
  );
}
