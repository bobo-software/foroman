import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '@stores/data/AuthStore';
import { useBusinessStore } from '@stores/data/BusinessStore';
import BusinessService from '@/services/businessService';

export function Onboard() {
  const navigate = useNavigate();
  const sessionUser = useAuthStore((s) => s.sessionUser);
  const isLoggedIn = !!useAuthStore((s) => s.accessToken ?? s.sessionUser?.accessToken);
  const currentBusiness = useBusinessStore((s) => s.currentBusiness);
  const fetchUserBusinesses = useBusinessStore((s) => s.fetchUserBusinesses);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [bankingDetails, setBankingDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditMode = !!currentBusiness;

  // Pre-fill form when editing existing business
  useEffect(() => {
    if (currentBusiness) {
      setName(currentBusiness.name || '');
      setAddress(currentBusiness.address || '');
      setPhone(currentBusiness.phone || '');
      setTaxId(currentBusiness.tax_id || '');
      setVatNumber(currentBusiness.vat_number || '');
      setRegistrationNumber(currentBusiness.registration_number || '');
      setBankingDetails(currentBusiness.banking_details || '');
    }
  }, [currentBusiness]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Business name is required');
      return;
    }
    if (!isLoggedIn || !sessionUser) {
      toast.error('Please log in to save your business');
      navigate('/login', { replace: true });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        tax_id: taxId.trim() || undefined,
        vat_number: vatNumber.trim() || undefined,
        registration_number: registrationNumber.trim() || undefined,
        banking_details: bankingDetails.trim() || undefined,
      };

      if (isEditMode && currentBusiness?.id) {
        await BusinessService.update(currentBusiness.id, payload);
        toast.success('Business updated');
      } else {
        const business = await BusinessService.create(payload);
        await BusinessService.linkUserToBusiness(Number(sessionUser.id), business.id!);
        toast.success('Business saved');
      }

      await fetchUserBusinesses(Number(sessionUser.id));
      navigate('/app/dashboard', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save business';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    toast.success('You can add your business later in Settings');
    navigate(isLoggedIn ? '/app/dashboard' : '/login', { replace: true });
  };

  const inputClass =
    'w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <Link to="/app" className="inline-flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-100 no-underline">
            <img src="/favicon.png" alt="" className="h-10 w-10 rounded-lg object-contain" />
            Foroman
          </Link>
          <h2 className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-100">
            {isEditMode ? 'Edit business details' : 'Business details'}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {isEditMode
              ? 'Update your business information that appears on quotes and invoices.'
              : 'Add your business now or skip and do it later.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          {/* Basic Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="businessName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Business name *
              </label>
              <input
                id="businessName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Acme Ltd"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Address
              </label>
              <textarea
                id="address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputClass}
                placeholder="123 Main St, City, Province, Postal Code"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                placeholder="+27 11 123 4567"
              />
            </div>

            <div>
              <label htmlFor="taxId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tax ID
              </label>
              <input
                id="taxId"
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className={inputClass}
                placeholder="Tax number"
              />
            </div>

            <div>
              <label htmlFor="vatNumber" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                VAT number
              </label>
              <input
                id="vatNumber"
                type="text"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                className={inputClass}
                placeholder="e.g. 4123456789"
              />
            </div>

            <div>
              <label htmlFor="registrationNumber" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Registration number
              </label>
              <input
                id="registrationNumber"
                type="text"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                className={inputClass}
                placeholder="Company registration"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="bankingDetails" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Banking details
              </label>
              <textarea
                id="bankingDetails"
                rows={3}
                value={bankingDetails}
                onChange={(e) => setBankingDetails(e.target.value)}
                className={inputClass}
                placeholder="Bank: FNB&#10;Account: 1234567890&#10;Branch: 250655&#10;Account Holder: Acme Ltd"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                This will appear on your quotations and invoices for customers to make payment.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-slate-900 dark:bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-slate-800 dark:hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              {loading ? 'Saving…' : isEditMode ? 'Save changes' : 'Save'}
            </button>
            {!isEditMode && (
              <button
                type="button"
                onClick={handleSkip}
                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                Skip for now
              </button>
            )}
            {isEditMode && (
              <Link
                to="/app/settings"
                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition no-underline text-center"
              >
                Cancel
              </Link>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
