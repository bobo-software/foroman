import { useState, useEffect, useCallback } from 'react';
import { LuPlus, LuPencil, LuTrash2, LuStar, LuUser } from 'react-icons/lu';
import ContactService from '@/services/contactService';
import type { Contact, CreateContactDto } from '@/types/contact';
import type { Company } from '@/types/company';
import toast from 'react-hot-toast';

interface CompanyContactsTabProps {
  company: Company;
}

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  is_primary: boolean;
  notes: string;
}

const initialFormData: ContactFormData = {
  name: '',
  email: '',
  phone: '',
  department: '',
  role: '',
  is_primary: false,
  notes: '',
};

export function CompanyContactsTab({ company }: CompanyContactsTabProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactFormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  const loadContacts = useCallback(async () => {
    if (!company.id) return;
    setLoading(true);
    try {
      const data = await ContactService.findByCompanyId(company.id);
      setContacts(data);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  }, [company.id]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const handleChange = useCallback((field: keyof ContactFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleAdd = () => {
    setEditingContact(null);
    setForm(initialFormData);
    setShowForm(true);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setForm({
      name: contact.name,
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      department: contact.department ?? '',
      role: contact.role ?? '',
      is_primary: contact.is_primary ?? false,
      notes: contact.notes ?? '',
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingContact(null);
    setForm(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const payload: CreateContactDto = {
        company_id: company.id,
        name: form.name.trim(),
        email: form.email?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        department: form.department?.trim() || undefined,
        role: form.role?.trim() || undefined,
        is_primary: form.is_primary,
        notes: form.notes?.trim() || undefined,
      };

      if (editingContact) {
        await ContactService.update(editingContact.id!, payload);
        toast.success('Contact updated');
      } else {
        await ContactService.create(payload);
        toast.success('Contact added');
      }
      handleCancel();
      loadContacts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save contact');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contact: Contact) => {
    if (!confirm(`Delete contact "${contact.name}"?`)) return;
    try {
      await ContactService.delete(contact.id!);
      toast.success('Contact deleted');
      loadContacts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete contact');
    }
  };

  const handleSetPrimary = async (contact: Contact) => {
    if (contact.is_primary) return;
    try {
      await ContactService.setPrimary(contact.id!, company.id!);
      toast.success(`${contact.name} set as primary contact`);
      loadContacts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to set primary contact');
    }
  };

  const inputClass =
    'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400';
  const labelClass = 'block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300';

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <div className="text-slate-500 dark:text-slate-400">Loading contacts…</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Contacts</h2>
        {!showForm && (
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <LuPlus size={16} />
            Add contact
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            {editingContact ? 'Edit contact' : 'New contact'}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contact-name" className={labelClass}>Name *</label>
              <input
                id="contact-name"
                type="text"
                required
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="contact-email" className={labelClass}>Email</label>
              <input
                id="contact-email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="contact-phone" className={labelClass}>Phone</label>
              <input
                id="contact-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="contact-department" className={labelClass}>Department</label>
              <input
                id="contact-department"
                type="text"
                value={form.department}
                onChange={(e) => handleChange('department', e.target.value)}
                className={inputClass}
                placeholder="e.g. Finance, Procurement"
              />
            </div>
            <div>
              <label htmlFor="contact-role" className={labelClass}>Role / Title</label>
              <input
                id="contact-role"
                type="text"
                value={form.role}
                onChange={(e) => handleChange('role', e.target.value)}
                className={inputClass}
                placeholder="e.g. Manager, Director"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                id="contact-primary"
                type="checkbox"
                checked={form.is_primary}
                onChange={(e) => handleChange('is_primary', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="contact-primary" className="text-sm text-slate-700 dark:text-slate-300">
                Primary contact
              </label>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="contact-notes" className={labelClass}>Notes</label>
              <textarea
                id="contact-notes"
                rows={2}
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingContact ? 'Update' : 'Add'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {contacts.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          No contacts for this company yet.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
          {contacts.map((contact) => (
            <li key={contact.id} className="py-4 first:pt-0">
              <div className="flex items-start gap-3">
                <div className="shrink-0 p-2 rounded-full bg-slate-100 dark:bg-slate-700">
                  <LuUser size={20} className="text-slate-500 dark:text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {contact.name}
                    </span>
                    {contact.is_primary && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                        <LuStar size={12} />
                        Primary
                      </span>
                    )}
                  </div>
                  {(contact.role || contact.department) && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {contact.role}{contact.role && contact.department ? ' · ' : ''}{contact.department}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                    {contact.email && <span>{contact.email}</span>}
                    {contact.phone && <span>{contact.phone}</span>}
                  </div>
                  {contact.notes && (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 italic">
                      {contact.notes}
                    </p>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-1">
                  {!contact.is_primary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(contact)}
                      className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                      title="Set as primary"
                    >
                      <LuStar size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleEdit(contact)}
                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Edit"
                  >
                    <LuPencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(contact)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Delete"
                  >
                    <LuTrash2 size={16} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CompanyContactsTab;
