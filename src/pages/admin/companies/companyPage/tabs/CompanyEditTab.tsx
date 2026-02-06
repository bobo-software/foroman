import { useState, useCallback } from 'react';
import CompanyService from '@/services/companyService';
import type { Company, CreateCompanyDto } from '@/types/company';
import toast from 'react-hot-toast';

interface CompanyEditTabProps {
  company: Company;
  onCompanyUpdate?: (company: Company) => void;
}

const BUSINESS_TYPES = [
  { value: '', label: 'Select type…' },
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'llc', label: 'LLC' },
  { value: 'corporation', label: 'Corporation' },
  { value: 'other', label: 'Other' },
];

export function CompanyEditTab({ company, onCompanyUpdate }: CompanyEditTabProps) {
  const [form, setForm] = useState<CreateCompanyDto>({
    name: company.name,
    email: company.email ?? '',
    phone: company.phone ?? '',
    address: company.address ?? '',
    contact_person: company.contact_person ?? '',
    business_type: company.business_type ?? '',
    tax_id: company.tax_id ?? '',
    registration_number: company.registration_number ?? '',
    vat_number: company.vat_number ?? '',
    industry: company.industry ?? '',
    website: company.website ?? '',
    notes: company.notes ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = useCallback((field: keyof CreateCompanyDto, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Company name is required');
      return;
    }
    setSaving(true);
    try {
      await CompanyService.update(company.id!, {
        name: form.name.trim(),
        email: form.email?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        address: form.address?.trim() || undefined,
        contact_person: form.contact_person?.trim() || undefined,
        business_type: form.business_type || undefined,
        tax_id: form.tax_id?.trim() || undefined,
        registration_number: form.registration_number?.trim() || undefined,
        vat_number: form.vat_number?.trim() || undefined,
        industry: form.industry?.trim() || undefined,
        website: form.website?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      });
      toast.success('Company updated');
      // Refresh company data
      const updated = await CompanyService.findById(company.id!);
      if (updated) {
        onCompanyUpdate?.(updated);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update company');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors';
  const labelClass = 'block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300';

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
        Edit company details
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className={labelClass}>Company name *</label>
            <input
              id="name"
              type="text"
              required
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="contact_person" className={labelClass}>Contact person</label>
            <input
              id="contact_person"
              type="text"
              value={form.contact_person ?? ''}
              onChange={(e) => handleChange('contact_person', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input
              id="email"
              type="email"
              value={form.email ?? ''}
              onChange={(e) => handleChange('email', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>Phone</label>
            <input
              id="phone"
              type="tel"
              value={form.phone ?? ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="website" className={labelClass}>Website</label>
            <input
              id="website"
              type="text"
              value={form.website ?? ''}
              onChange={(e) => handleChange('website', e.target.value)}
              className={inputClass}
              placeholder="https://example.com"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="address" className={labelClass}>Address</label>
            <textarea
              id="address"
              rows={3}
              value={form.address ?? ''}
              onChange={(e) => handleChange('address', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Business Details */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Business credentials
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="business_type" className={labelClass}>Business type</label>
              <select
                id="business_type"
                value={form.business_type ?? ''}
                onChange={(e) => handleChange('business_type', e.target.value)}
                className={inputClass}
              >
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="industry" className={labelClass}>Industry</label>
              <input
                id="industry"
                type="text"
                value={form.industry ?? ''}
                onChange={(e) => handleChange('industry', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="tax_id" className={labelClass}>Tax ID</label>
              <input
                id="tax_id"
                type="text"
                value={form.tax_id ?? ''}
                onChange={(e) => handleChange('tax_id', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="registration_number" className={labelClass}>Registration number</label>
              <input
                id="registration_number"
                type="text"
                value={form.registration_number ?? ''}
                onChange={(e) => handleChange('registration_number', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="vat_number" className={labelClass}>VAT number</label>
              <input
                id="vat_number"
                type="text"
                value={form.vat_number ?? ''}
                onChange={(e) => handleChange('vat_number', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <label htmlFor="notes" className={labelClass}>Notes</label>
          <textarea
            id="notes"
            rows={4}
            value={form.notes ?? ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            className={inputClass}
            placeholder="Additional notes about this company…"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CompanyEditTab;
