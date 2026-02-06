import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ItemService from '@/services/itemService';
import { useBusinessStore } from '@/stores/data/BusinessStore';
import type { CreateItemDto } from '@/types/item';
import toast from 'react-hot-toast';

const initial: CreateItemDto = {
  name: '',
  sku: '',
  description: '',
  unit_price: 0,
  cost_price: undefined,
  quantity: 0,
  tax_rate: undefined,
};

export function ItemFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const businessId = useBusinessStore((s) => s.currentBusiness?.id);
  const isEdit = Boolean(id);
  const [form, setForm] = useState<CreateItemDto>(initial);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    ItemService.findById(Number(id))
      .then((item) => {
        if (!cancelled && item) {
          setForm({
            name: item.name,
            sku: item.sku ?? '',
            description: item.description ?? '',
            unit_price: item.unit_price ?? 0,
            cost_price: item.cost_price,
            quantity: item.quantity ?? 0,
            tax_rate: item.tax_rate,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const update = (key: keyof CreateItemDto, value: string | number | undefined) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    const unitPrice = Number(form.unit_price);
    if (Number.isNaN(unitPrice) || unitPrice < 0) {
      toast.error('Unit price must be a non-negative number');
      return;
    }
    setSaving(true);
    try {
      const quantity = form.quantity != null ? Number(form.quantity) : 0;
      const payload = {
        ...(businessId != null && { business_id: businessId }),
        name: form.name.trim(),
        sku: form.sku?.trim() || undefined,
        description: form.description?.trim() || undefined,
        unit_price: unitPrice,
        cost_price: form.cost_price != null ? Number(form.cost_price) : undefined,
        quantity: Number.isNaN(quantity) || quantity < 0 ? 0 : quantity,
        tax_rate: form.tax_rate != null ? Number(form.tax_rate) : undefined,
      };
      if (isEdit && id) {
        await ItemService.update(Number(id), payload);
        toast.success('Item updated');
        navigate(`/app/items/${id}`);
      } else {
        await ItemService.create(payload);
        toast.success('Item created');
        navigate('/app/items');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (isEdit ? 'Failed to update item' : 'Failed to create item'));
    } finally {
      setSaving(false);
    }
  };

  const hasNoBusiness = !isEdit && businessId == null;

  if (loading) {
    return <div className="text-slate-500">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">{isEdit ? 'Edit item' : 'New item'}</h1>
        <Link
          to="/app/items"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500 no-underline"
        >
          ← Back to stock
        </Link>
      </div>
      {hasNoBusiness && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Add your business first before creating items.{' '}
          <Link to="/onboard" className="font-medium text-amber-900 underline hover:no-underline">
            Add business
          </Link>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">Name *</label>
          <input
            id="name"
            type="text"
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="sku" className="block text-sm font-medium text-slate-700">SKU</label>
          <input
            id="sku"
            type="text"
            value={form.sku ?? ''}
            onChange={(e) => update('sku', e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">Quantity</label>
          <input
            id="quantity"
            type="number"
            min={0}
            step={1}
            value={form.quantity ?? 0}
            onChange={(e) => update('quantity', e.target.value ? Number(e.target.value) : 0)}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="unit_price" className="block text-sm font-medium text-slate-700">Selling price *</label>
          <input
            id="unit_price"
            type="number"
            min={0}
            step="0.01"
            required
            value={form.unit_price === 0 ? '' : form.unit_price}
            onChange={(e) => update('unit_price', e.target.value ? Number(e.target.value) : 0)}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="cost_price" className="block text-sm font-medium text-slate-700">Cost price (optional)</label>
          <input
            id="cost_price"
            type="number"
            min={0}
            step="0.01"
            value={form.cost_price ?? ''}
            onChange={(e) => update('cost_price', e.target.value ? Number(e.target.value) : undefined)}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="tax_rate" className="block text-sm font-medium text-slate-700">Tax rate (%)</label>
          <input
            id="tax_rate"
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={form.tax_rate ?? ''}
            onChange={(e) => update('tax_rate', e.target.value ? Number(e.target.value) : undefined)}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description</label>
          <textarea
            id="description"
            rows={3}
            value={form.description ?? ''}
            onChange={(e) => update('description', e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || hasNoBusiness}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEdit ? 'Update item' : 'Create item'}
          </button>
          <Link
            to="/app/items"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 no-underline hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
