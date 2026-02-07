import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { QuotationForm } from '@/components/elements/QuotationForm';

export function QuotationFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quotationId = id ? parseInt(id, 10) : undefined;
  const companyIdParam = searchParams.get('company_id');
  const initialCompanyId = companyIdParam ? parseInt(companyIdParam, 10) : undefined;

  return (
    <QuotationForm
      quotationId={quotationId}
      initialCompanyId={initialCompanyId}
      onSuccess={() => navigate('/app/quotations')}
      onCancel={() =>
        quotationId ? navigate(`/app/quotations/${quotationId}`) : navigate('/app/quotations')
      }
    />
  );
}
