import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ItemService from '../services/itemService';
import type { Item } from '../types/item';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function ItemList() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ItemService.findAll({
        orderBy: 'name',
        orderDirection: 'ASC',
      });
      setItems(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
      console.error('Failed to load items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await ItemService.delete(id);
      loadItems();
    } catch (err: unknown) {
      alert('Failed to delete item: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Loading items…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Stock</h1>
        <Link
          to="/app/items/create"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white no-underline hover:bg-indigo-500"
        >
          + Add item
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No items yet. Add your first product or stock item to get started.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left font-medium text-slate-600">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">Unit price</th>
                <th className="px-5 py-3">Tax rate</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-medium text-slate-800">{item.name}</td>
                  <td className="px-5 py-3 text-slate-600">{item.sku ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-800">{formatCurrency(item.unit_price)}</td>
                  <td className="px-5 py-3 text-slate-600">
                    {item.tax_rate != null ? `${item.tax_rate}%` : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      to={`/app/items/${item.id}`}
                      className="mr-3 font-medium text-indigo-600 hover:text-indigo-500 no-underline"
                    >
                      View
                    </Link>
                    <Link
                      to={`/app/items/${item.id}/edit`}
                      className="mr-3 font-medium text-indigo-600 hover:text-indigo-500 no-underline"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id!)}
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
