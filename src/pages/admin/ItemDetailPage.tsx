import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ItemService from '@/services/itemService';
import type { Item } from '@/types/item';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    ItemService.findById(Number(id))
      .then((data) => {
        if (!cancelled) setItem(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load item');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div className="text-slate-500">Loading…</div>;
  }
  if (error || !item) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{error ?? 'Item not found.'}</p>
        <Link to="/app/items" className="text-indigo-600 hover:text-indigo-500 no-underline">
          Back to stock
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">{item.name}</h1>
        <div className="flex gap-2">
          <Link
            to={`/app/items/${item.id}/edit`}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white no-underline hover:bg-indigo-500"
          >
            Edit
          </Link>
          <Link
            to="/app/items"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 no-underline hover:bg-slate-50"
          >
            Back to stock
          </Link>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-slate-500">SKU</dt>
            <dd className="mt-1 text-slate-800">{item.sku ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Unit price</dt>
            <dd className="mt-1 text-slate-800">{formatCurrency(item.unit_price)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Tax rate</dt>
            <dd className="mt-1 text-slate-800">{item.tax_rate != null ? `${item.tax_rate}%` : '—'}</dd>
          </div>
          {item.description && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-slate-500">Description</dt>
              <dd className="mt-1 text-slate-800 whitespace-pre-wrap">{item.description}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
