import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CompanyService from '@/services/companyService';
import { useBusinessStore } from '@/stores/data/BusinessStore';
import type { CreateCompanyDto, Company } from '@/types/company';
import toast from 'react-hot-toast';

const initial: CreateCompanyDto = {
  name: '',
  email: '',
  phone: '',
  address: '',
  company_name: '',
  contact_person: '',
  tax_id: '',
  business_type: '',
  registration_number: '',
  vat_number: '',
  industry: '',
  website: '',
  notes: '',
};

const BUSINESS_TYPES = [
  { value: '', label: 'Select type…' },
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'llc', label: 'LLC' },
  { value: 'corporation', label: 'Corporation' },
  { value: 'other', label: 'Other' },
];

export function CompanyFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  const businessId = useBusinessStore((s) => s.currentBusiness?.id);
  const [form, setForm] = useState<CreateCompanyDto>(initial);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load existing company data in edit mode
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    CompanyService.findById(Number(id))
      .then((data) => {
        if (!cancelled && data) {
          setForm({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            company_name: data.company_name || '',
            contact_person: data.contact_person || '',
            tax_id: data.tax_id || '',
            business_type: data.business_type || '',
            registration_number: data.registration_number || '',
            vat_number: data.vat_number || '',
            industry: data.industry || '',
            website: data.website || '',
            notes: data.notes || '',
          });
        }
      })
      .catch((e) => {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : 'Failed to load company');
          navigate('/app/companies');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const update = (key: keyof CreateCompanyDto, value: string | undefined) => {
    setForm((prev) => ({ ...prev, [key]: value ?? '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Company name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        ...(businessId != null && { business_id: businessId }),
        name: form.name.trim(),
        email: form.email?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        address: form.address?.trim() || undefined,
        company_name: form.company_name?.trim() || undefined,
        contact_person: form.contact_person?.trim() || undefined,
        tax_id: form.tax_id?.trim() || undefined,
        business_type: form.business_type?.trim() || undefined,
        registration_number: form.registration_number?.trim() || undefined,
        vat_number: form.vat_number?.trim() || undefined,
        industry: form.industry?.trim() || undefined,
        website: form.website?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      };

      if (isEditMode) {
        await CompanyService.update(Number(id), payload);
        toast.success('Company updated');
        navigate(`/app/companies/${id}`);
      } else {
        await CompanyService.create(payload);
        toast.success('Company created');
        navigate('/app/companies');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'create'} company`);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed';

  const hasNoBusiness = businessId == null;

  if (loading) {
    return (
      <div className="flex min-h-0 flex-col">
        <div className="flex shrink-0 items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Edit company</h1>
        </div>
        <div className="mt-6 text-slate-500 dark:text-slate-400">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {isEditMode ? 'Edit company' : 'New company'}
        </h1>
        <Link
          to={isEditMode ? `/app/companies/${id}` : '/app/companies'}
          className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 no-underline"
        >
          ← {isEditMode ? 'Back to company' : 'Back to companies'}
        </Link>
      </div>
      {hasNoBusiness && !isEditMode && (
        <div className="mt-6 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-800 dark:text-amber-200">
          Add your business first before creating companies.{' '}
          <Link to="/onboard" className="font-medium text-amber-900 dark:text-amber-100 underline hover:no-underline">
            Add business
          </Link>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="mt-6 flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm lg:p-8"
      >
        <div className="grid flex-1 gap-8 lg:grid-cols-2">
          {/* Company & Contact */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Company & Contact
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Company name *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  disabled={saving}
                  placeholder="e.g. Acme Corporation"
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="contact_person" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Contact person
                </label>
                <input
                  id="contact_person"
                  type="text"
                  value={form.contact_person ?? ''}
                  onChange={(e) => update('contact_person', e.target.value)}
                  disabled={saving}
                  placeholder="e.g. John Smith"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email ?? ''}
                  onChange={(e) => update('email', e.target.value)}
                  disabled={saving}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Phone
                </label>
                <input
                  id="phone"
                  type="text"
                  value={form.phone ?? ''}
                  onChange={(e) => update('phone', e.target.value)}
                  disabled={saving}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Address
              </label>
              <textarea
                id="address"
                rows={3}
                value={form.address ?? ''}
                onChange={(e) => update('address', e.target.value)}
                disabled={saving}
                className={inputClass}
              />
            </div>
          </section>

          {/* Business credentials */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Business credentials
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="business_type" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Business type
                </label>
                <select
                  id="business_type"
                  value={form.business_type ?? ''}
                  onChange={(e) => update('business_type', e.target.value)}
                  disabled={saving}
                  className={inputClass}
                >
                  {BUSINESS_TYPES.map((opt) => (
                    <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="tax_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Tax ID
                </label>
                <input
                  id="tax_id"
                  type="text"
                  value={form.tax_id ?? ''}
                  onChange={(e) => update('tax_id', e.target.value)}
                  disabled={saving}
                  placeholder="EIN, SSN, or local tax number"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="registration_number" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Registration number
                </label>
                <input
                  id="registration_number"
                  type="text"
                  value={form.registration_number ?? ''}
                  onChange={(e) => update('registration_number', e.target.value)}
                  disabled={saving}
                  placeholder="Official company registration number"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="vat_number" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  VAT number
                </label>
                <input
                  id="vat_number"
                  type="text"
                  value={form.vat_number ?? ''}
                  onChange={(e) => update('vat_number', e.target.value)}
                  disabled={saving}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Industry
                </label>
                <input
                  id="industry"
                  type="text"
                  value={form.industry ?? ''}
                  onChange={(e) => update('industry', e.target.value)}
                  disabled={saving}
                  placeholder="e.g. Retail, Manufacturing"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Website
                </label>
                <input
                  id="website"
                  type="url"
                  value={form.website ?? ''}
                  onChange={(e) => update('website', e.target.value)}
                  disabled={saving}
                  placeholder="https://"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Notes
              </label>
              <textarea
                id="notes"
                rows={4}
                value={form.notes ?? ''}
                onChange={(e) => update('notes', e.target.value)}
                disabled={saving}
                placeholder="Additional notes about this company"
                className={inputClass}
              />
            </div>
          </section>
        </div>

        <div className="mt-8 flex shrink-0 gap-3 border-t border-slate-200 dark:border-slate-700 pt-6">
          <button
            type="submit"
            disabled={saving || (hasNoBusiness && !isEditMode)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                Saving…
              </>
            ) : isEditMode ? (
              'Save changes'
            ) : (
              'Create company'
            )}
          </button>
          <Link
            to={isEditMode ? `/app/companies/${id}` : '/app/companies'}
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 no-underline hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
