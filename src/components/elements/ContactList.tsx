import { useEffect, useMemo, useState } from 'react';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { useContactStore } from '../../stores/data/ContactStore';
import { useAutoRefresh, useProjectId } from '../../hooks';
import MRTThemeProvider from '../providers/MRTThemeProvider';
import type { Contact } from '../../types/contact';
import { LuFilter, LuPlus, LuStar } from 'react-icons/lu';

interface ContactListProps {
  companyId?: number;
  onAddContact?: () => void;
  onSelectContact?: (contact: Contact) => void;
}

export function ContactList({ companyId, onAddContact, onSelectContact }: ContactListProps) {
  const { contacts, loading, error, fetchContacts } = useContactStore();
  const projectId = useProjectId();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchContacts(companyId);
  }, [fetchContacts, companyId]);

  // Auto-refresh when contacts table changes (real-time updates)
  useAutoRefresh(projectId, 'contacts', () => fetchContacts(companyId));

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.trim().toLowerCase();
    return contacts.filter(
      (c) =>
        (c.name?.toLowerCase().includes(q)) ||
        (c.email?.toLowerCase().includes(q)) ||
        (c.phone?.toLowerCase().includes(q)) ||
        (c.department?.toLowerCase().includes(q)) ||
        (c.role?.toLowerCase().includes(q))
    );
  }, [contacts, search]);

  const columns = useMemo<MRT_ColumnDef<Contact>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        enableColumnFilter: true,
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span>{row.original.name}</span>
            {row.original.is_primary && (
              <LuStar className="h-4 w-4 text-amber-500" title="Primary contact" />
            )}
          </div>
        ),
      },
      { accessorKey: 'email', header: 'Email', enableColumnFilter: true },
      { accessorKey: 'phone', header: 'Phone', enableColumnFilter: true },
      { accessorKey: 'department', header: 'Department', enableColumnFilter: true },
      { accessorKey: 'role', header: 'Role', enableColumnFilter: true },
    ],
    []
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Contacts</h2>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center text-slate-500 dark:text-slate-400">
          Loading contacts…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Contacts</h2>
        {onAddContact && (
          <button
            type="button"
            onClick={onAddContact}
            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <LuPlus size={16} />
            Add contact
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            <LuFilter size={18} />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts…"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            aria-label="Search contacts"
          />
        </div>
      </div>
      {contacts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center text-slate-500 dark:text-slate-400">
          No contacts yet.{' '}
          {onAddContact && (
            <button
              type="button"
              onClick={onAddContact}
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Add the first contact
            </button>
          )}
        </div>
      ) : (
        <MRTThemeProvider>
          <MaterialReactTable
            columns={columns}
            data={filteredContacts}
            state={{ showAlertBanner: !!error }}
            enableTopToolbar={false}
            enableColumnFilters={false}
            enableGlobalFilter={false}
            enableColumnOrdering={false}
            enableColumnResizing={false}
            initialState={{ density: 'compact' }}
            muiTableBodyRowProps={({ row }) => ({
              onClick: () => {
                if (onSelectContact) {
                  onSelectContact(row.original);
                }
              },
              sx: onSelectContact ? { cursor: 'pointer' } : undefined,
            })}
          />
        </MRTThemeProvider>
      )}
    </div>
  );
}
