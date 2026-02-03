import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CustomerService from '../services/customerService';
import type { Customer } from '../types/customer';

export function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CustomerService.findAll({
        orderBy: 'name',
        orderDirection: 'ASC',
      });
      setCustomers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      await CustomerService.delete(id);
      loadCustomers();
    } catch (err: unknown) {
      alert('Failed to delete customer: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Loading customers…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
        <Link
          to="/app/customers/create"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white no-underline hover:bg-indigo-500"
        >
          + Add customer
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {error}
        </div>
      )}

      {customers.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No customers yet. Add your first customer to get started.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left font-medium text-slate-600">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Business</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Tax ID</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-slate-100 hover:bg-slate-50/50"
                >
                  <td className="px-5 py-3 font-medium text-slate-800">{c.name}</td>
                  <td className="px-5 py-3 text-slate-600">{c.company_name ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-600">{c.email ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-600">{c.phone ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-600">{c.tax_id ?? '—'}</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      to={`/app/customers/${c.id}`}
                      className="mr-3 font-medium text-indigo-600 hover:text-indigo-500 no-underline"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id!)}
                      className="font-medium text-red-600 hover:text-red-500 bg-transparent border-none cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
