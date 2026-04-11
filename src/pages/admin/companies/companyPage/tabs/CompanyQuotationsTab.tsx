import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuPlus } from 'react-icons/lu';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { formatCurrency } from '@/utils/currency';
import type { Quotation } from '@/types/quotation';
import MRTThemeProvider from '@/components/providers/MRTThemeProvider';
import type { CompanyTabProps } from './types';
import { formatDate } from './types';

export function CompanyQuotationsTab({ company, selectedProjectId, quotations, docsLoading }: CompanyTabProps) {
  const navigate = useNavigate();
  const projectQuery = selectedProjectId !== 'all' ? `&project_id=${selectedProjectId}` : '';

  const columns = useMemo<MRT_ColumnDef<Quotation>[]>(
    () => [
      {
        accessorKey: 'quotation_number',
        header: 'Quote No.',
        Cell: ({ cell }) => String(cell.getValue() ?? '—'),
      },
      {
        accessorKey: 'issue_date',
        header: 'Date',
        Cell: ({ cell }) => {
          const val = cell.getValue<string>();
          return val ? formatDate(val) : '—';
        },
        sortingFn: 'datetime',
      },
      {
        accessorKey: 'valid_until',
        header: 'Valid Until',
        Cell: ({ cell }) => {
          const val = cell.getValue<string>();
          return val ? formatDate(val) : '—';
        },
        sortingFn: 'datetime',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ cell }) => {
          const val = String(cell.getValue() ?? '—');
          return val.charAt(0).toUpperCase() + val.slice(1);
        },
      },
      {
        accessorKey: 'total',
        header: 'Total',
        Cell: ({ cell, row }) => formatCurrency(Number(cell.getValue()), row.original.currency),
      },
    ],
    []
  );

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Quotations ({quotations.length})
          </h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            All price quotations issued to {company.name}
          </p>
        </div>
        <Link
          to={`/app/quotations/create?company_id=${company.id}${projectQuery}&from_company=${company.id}`}
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 rounded-lg transition-colors no-underline"
        >
          <LuPlus className="w-4 h-4" />
          New Quotation
        </Link>
      </div>

      {docsLoading ? (
        <div className="py-8 text-center text-slate-500 dark:text-slate-400">
          Loading quotations…
        </div>
      ) : (
        <MRTThemeProvider>
          <MaterialReactTable
            columns={columns}
            data={quotations}
            enableTopToolbar={false}
            enableColumnFilters={false}
            enableGlobalFilter={false}
            enableColumnOrdering={false}
            enableColumnResizing={false}
            muiTableBodyRowProps={({ row }) => ({
              onClick: () => {
                if (row.original.id != null) {
                  navigate(`/app/quotations/${row.original.id}?from_company=${company.id}`);
                }
              },
              sx: { cursor: 'pointer' },
            })}
            initialState={{
              density: 'compact',
              sorting: [{ id: 'issue_date', desc: true }],
            }}
          />
        </MRTThemeProvider>
      )}
    </div>
  );
}

export default CompanyQuotationsTab;
