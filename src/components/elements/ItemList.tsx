import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Box, IconButton, Tooltip } from '@mui/material';
import { LuEye, LuFilter, LuPencil, LuTrash2 } from 'react-icons/lu';
import { useItemStore } from '../../stores/data/ItemStore';
import { useBusinessStore } from '../../stores/data/BusinessStore';
import { useAutoRefresh, useProjectId } from '../../hooks';
import MRTThemeProvider from '../providers/MRTThemeProvider';
import type { Item } from '../../types/item';
import { formatCurrency } from '../../utils/currency';

export function ItemList() {
  const { items, loading, error, fetchItems, removeItem } = useItemStore();
  const businessId = useBusinessStore((s) => s.currentBusiness?.id);
  const projectId = useProjectId();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchItems();
  }, [fetchItems, businessId]);

  // Auto-refresh when items table changes (real-time updates)
  useAutoRefresh(projectId, 'items', fetchItems);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter(
      (i) =>
        (i.name?.toLowerCase().includes(q)) ||
        (i.sku?.toLowerCase().includes(q)) ||
        (i.description?.toLowerCase().includes(q))
    );
  }, [items, search]);

  const handleDelete = useCallback(
    async (id: number) => {
      if (!confirm('Are you sure you want to delete this item?')) return;
      try {
        await removeItem(id);
      } catch (err: unknown) {
        alert('Failed to delete item: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    },
    [removeItem]
  );

  const columns = useMemo<MRT_ColumnDef<Item>[]>(
    () => [
      { accessorKey: 'name', header: 'Name', enableColumnFilter: true },
      { accessorKey: 'sku', header: 'SKU', enableColumnFilter: true },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        Cell: ({ cell }) => (cell.getValue() as number | null) ?? 0,
        enableColumnFilter: false,
      },
      {
        accessorKey: 'unit_price',
        header: 'Selling price',
        Cell: ({ cell }) => formatCurrency(Number(cell.getValue())),
        enableColumnFilter: false,
      },
      {
        accessorKey: 'tax_rate',
        header: 'Tax rate',
        Cell: ({ cell }) => (cell.getValue() != null ? `${cell.getValue()}%` : '—'),
        enableColumnFilter: false,
      },
      {
        id: 'actions',
        header: 'Actions',
        enableColumnFilter: false,
        enableSorting: false,
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="View">
              <IconButton component={Link} to={`/app/items/${row.original.id}`} size="small">
                <LuEye size={18} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton component={Link} to={`/app/items/${row.original.id}/edit`} size="small">
                <LuPencil size={18} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDelete(row.original.id!)}
              >
                <LuTrash2 size={18} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [handleDelete]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Stock</h1>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center text-slate-500 dark:text-slate-400">
          Loading items…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Stock</h1>
      <div className="flex items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            <LuFilter size={18} />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            aria-label="Search items"
          />
        </div>
        <Link
          to="/app/items/create"
          className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white no-underline hover:bg-indigo-500"
        >
          + Add item
        </Link>
      </div>
      <MRTThemeProvider>
        <MaterialReactTable
          columns={columns}
          data={filteredItems}
          state={{ showAlertBanner: !!error }}
          muiToolbarAlertBannerProps={error ? { color: 'error', children: error } : undefined}
          enableTopToolbar={false}
          enableColumnFilters={false}
          enableGlobalFilter={false}
          enableColumnOrdering={false}
          enableColumnResizing={false}
          initialState={{ density: 'compact' }}
        />
      </MRTThemeProvider>
    </div>
  );
}
