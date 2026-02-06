import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Box, IconButton, Tooltip } from '@mui/material';
import { LuFileDown, LuFilter } from 'react-icons/lu';
import type { Invoice } from '../../types/invoice';
import { useInvoiceStore } from '../../stores/data/InvoiceStore';
import { useAutoRefresh, useProjectId } from '../../hooks';
import MRTThemeProvider from '../providers/MRTThemeProvider';
import { formatCurrency } from '../../utils/currency';
import { downloadInvoicePdfById } from '../../utils/invoicePdf';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString();
}

export function InvoiceList() {
  const navigate = useNavigate();
  const { invoices, loading, error, fetchInvoices } = useInvoiceStore();
  const projectId = useProjectId();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchInvoices({ status: filterStatus });
  }, [fetchInvoices, filterStatus]);

  // Auto-refresh when invoices table changes (real-time updates)
  useAutoRefresh(projectId, 'invoices', () => fetchInvoices({ status: filterStatus }));

  const filteredInvoices = useMemo(() => {
    if (!search.trim()) return invoices;
    const q = search.trim().toLowerCase();
    return invoices.filter(
      (inv) =>
        (inv.invoice_number?.toLowerCase().includes(q)) ||
        (inv.customer_name?.toLowerCase().includes(q)) ||
        (inv.status?.toLowerCase().includes(q))
    );
  }, [invoices, search]);

  const handleExportPdf = useCallback(async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await downloadInvoicePdfById(id);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Failed to download PDF');
    }
  }, []);

  const columns = useMemo<MRT_ColumnDef<Invoice>[]>(
    () => [
      { accessorKey: 'invoice_number', header: 'Invoice #', enableColumnFilter: true },
      { accessorKey: 'customer_name', header: 'Company', enableColumnFilter: true },
      {
        accessorKey: 'issue_date',
        header: 'Issue Date',
        Cell: ({ cell }) => formatDate(String(cell.getValue())),
        enableColumnFilter: false,
      },
      {
        accessorKey: 'due_date',
        header: 'Due Date',
        Cell: ({ cell }) => formatDate(String(cell.getValue())),
        enableColumnFilter: false,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        enableColumnFilter: false,
      },
      {
        accessorKey: 'total',
        header: 'Total',
        Cell: ({ cell, row }) => formatCurrency(Number(cell.getValue()), row.original.currency),
        enableColumnFilter: false,
      },
      {
        id: 'export',
        header: 'Export',
        enableColumnFilter: false,
        enableSorting: false,
        size: 70,
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
            <Tooltip title="Download PDF">
              <IconButton
                size="small"
                onClick={(e) => handleExportPdf(e, row.original.id!)}
                aria-label="Download PDF"
              >
                <LuFileDown size={18} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [handleExportPdf]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Invoices</h1>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center text-slate-500 dark:text-slate-400">
          Loading invoices…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Invoices</h1>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            <LuFilter size={18} />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoices…"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            aria-label="Search invoices"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="shrink-0 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <Link
          to="/app/invoices/create"
          className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white no-underline hover:bg-indigo-500"
        >
          + New Invoice
        </Link>
      </div>
      <MRTThemeProvider>
        <MaterialReactTable
          columns={columns}
          data={filteredInvoices}
          state={{ showAlertBanner: !!error }}
          muiToolbarAlertBannerProps={error ? { color: 'error', children: error } : undefined}
          enableTopToolbar={false}
          enableColumnFilters={false}
          enableGlobalFilter={false}
          enableColumnOrdering={false}
          enableColumnResizing={false}
          initialState={{ density: 'compact' }}
          muiTableBodyRowProps={({ row }) => ({
            onClick: () => {
              const id = row.original.id;
              if (id != null) navigate(`/app/invoices/${id}`);
            },
            sx: {
              cursor: 'pointer',
            },
          })}
        />
      </MRTThemeProvider>
    </div>
  );
}
