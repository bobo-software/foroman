import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CustomerService from '@/services/customerService';
import type { CreateCustomerDto } from '@/types/customer';
import toast from 'react-hot-toast';

const initial: CreateCustomerDto = {
  name: '',
  email: '',
  phone: '',
  address: '',
  company_name: '',
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

export function CustomerFormPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateCustomerDto>(initial);
  const [saving, setSaving] = useState(false);

  const update = (key: keyof CreateCustomerDto, value: string | undefined) => {
    setForm((prev) => ({ ...prev, [key]: value ?? '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      await CustomerService.create({
        ...form,
        name: form.name.trim(),
        email: form.email?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        address: form.address?.trim() || undefined,
        company_name: form.company_name?.trim() || undefined,
        tax_id: form.tax_id?.trim() || undefined,
        business_type: form.business_type?.trim() || undefined,
        registration_number: form.registration_number?.trim() || undefined,
        vat_number: form.vat_number?.trim() || undefined,
        industry: form.industry?.trim() || undefined,
        website: form.website?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      });
      toast.success('Customer created');
      navigate('/app/customers');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500';

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">New customer</h1>
        <Link
          to="/app/customers"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500 no-underline"
        >
          ← Back to customers
        </Link>
      </div>
      <form
        onSubmit={handleSubmit}
        className="mt-6 flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8"
      >
        <div className="grid flex-1 gap-8 lg:grid-cols-2">
          {/* Contact & business name */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Contact & business</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">Name *</label>
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="company_name" className="block text-sm font-medium text-slate-700">Business / company name</label>
                <input
                  id="company_name"
                  type="text"
                  value={form.company_name ?? ''}
                  onChange={(e) => update('company_name', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                <input
                  id="email"
                  type="email"
                  value={form.email ?? ''}
                  onChange={(e) => update('email', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Phone</label>
                <input
                  id="phone"
                  type="text"
                  value={form.phone ?? ''}
                  onChange={(e) => update('phone', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-slate-700">Address</label>
              <textarea
                id="address"
                rows={3}
                value={form.address ?? ''}
                onChange={(e) => update('address', e.target.value)}
                className={inputClass}
              />
            </div>
          </section>

          {/* Business credentials */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Business credentials</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="business_type" className="block text-sm font-medium text-slate-700">Business type</label>
                <select
                  id="business_type"
                  value={form.business_type ?? ''}
                  onChange={(e) => update('business_type', e.target.value)}
                  className={inputClass}
                >
                  {BUSINESS_TYPES.map((opt) => (
                    <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="tax_id" className="block text-sm font-medium text-slate-700">Tax ID</label>
                <input
                  id="tax_id"
                  type="text"
                  value={form.tax_id ?? ''}
                  onChange={(e) => update('tax_id', e.target.value)}
                  placeholder="EIN, SSN, or local tax number"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="registration_number" className="block text-sm font-medium text-slate-700">Registration number</label>
                <input
                  id="registration_number"
                  type="text"
                  value={form.registration_number ?? ''}
                  onChange={(e) => update('registration_number', e.target.value)}
                  placeholder="Official company registration number"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="vat_number" className="block text-sm font-medium text-slate-700">VAT number</label>
                <input
                  id="vat_number"
                  type="text"
                  value={form.vat_number ?? ''}
                  onChange={(e) => update('vat_number', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-slate-700">Industry</label>
                <input
                  id="industry"
                  type="text"
                  value={form.industry ?? ''}
                  onChange={(e) => update('industry', e.target.value)}
                  placeholder="e.g. Retail, Manufacturing"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-slate-700">Website</label>
                <input
                  id="website"
                  type="url"
                  value={form.website ?? ''}
                  onChange={(e) => update('website', e.target.value)}
                  placeholder="https://"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700">Notes</label>
              <textarea
                id="notes"
                rows={4}
                value={form.notes ?? ''}
                onChange={(e) => update('notes', e.target.value)}
                className={inputClass}
              />
            </div>
          </section>
        </div>

        <div className="mt-8 flex shrink-0 gap-3 border-t border-slate-200 pt-6">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Create customer'}
          </button>
          <Link
            to="/app/customers"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 no-underline hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
