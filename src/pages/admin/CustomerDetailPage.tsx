import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CustomerService from '@/services/customerService';
import type { Customer } from '@/types/customer';

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  sole_proprietorship: 'Sole Proprietorship',
  partnership: 'Partnership',
  llc: 'LLC',
  corporation: 'Corporation',
  other: 'Other',
};

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    CustomerService.findById(Number(id))
      .then((data) => {
        if (!cancelled) setCustomer(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load customer');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="text-slate-500">Loading…</div>
    );
  }
  if (error || !customer) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{error ?? 'Customer not found.'}</p>
        <Link to="/app/customers" className="text-indigo-600 hover:text-indigo-500 no-underline">
          Back to customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">{customer.name}</h1>
        <Link
          to="/app/customers"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500 no-underline"
        >
          ← Back to customers
        </Link>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-slate-500">Email</dt>
            <dd className="mt-1 text-slate-800">{customer.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Phone</dt>
            <dd className="mt-1 text-slate-800">{customer.phone ?? '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-slate-500">Business / company name</dt>
            <dd className="mt-1 text-slate-800">{customer.company_name ?? '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-slate-500">Address</dt>
            <dd className="mt-1 text-slate-800 whitespace-pre-wrap">{customer.address ?? '—'}</dd>
          </div>
        </dl>
        {(customer.business_type || customer.tax_id || customer.registration_number || customer.vat_number || customer.industry || customer.website) && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Business credentials</h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {customer.business_type && (
                <div>
                  <dt className="text-sm font-medium text-slate-500">Business type</dt>
                  <dd className="mt-1 text-slate-800">
                    {BUSINESS_TYPE_LABELS[customer.business_type] ?? customer.business_type}
                  </dd>
                </div>
              )}
              {customer.tax_id && (
                <div>
                  <dt className="text-sm font-medium text-slate-500">Tax ID</dt>
                  <dd className="mt-1 text-slate-800">{customer.tax_id}</dd>
                </div>
              )}
              {customer.registration_number && (
                <div>
                  <dt className="text-sm font-medium text-slate-500">Registration number</dt>
                  <dd className="mt-1 text-slate-800">{customer.registration_number}</dd>
                </div>
              )}
              {customer.vat_number && (
                <div>
                  <dt className="text-sm font-medium text-slate-500">VAT number</dt>
                  <dd className="mt-1 text-slate-800">{customer.vat_number}</dd>
                </div>
              )}
              {customer.industry && (
                <div>
                  <dt className="text-sm font-medium text-slate-500">Industry</dt>
                  <dd className="mt-1 text-slate-800">{customer.industry}</dd>
                </div>
              )}
              {customer.website && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-slate-500">Website</dt>
                  <dd className="mt-1">
                    <a
                      href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-500 no-underline"
                    >
                      {customer.website}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
        {customer.notes && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <dt className="text-sm font-medium text-slate-500">Notes</dt>
            <dd className="mt-1 text-slate-800 whitespace-pre-wrap">{customer.notes}</dd>
          </div>
        )}
      </div>
    </div>
  );
}
