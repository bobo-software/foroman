import { create } from 'zustand';
import ContactService from '../../services/contactService';
import type { Contact } from '../../types/contact';

interface ContactState {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  fetchContacts: (companyId?: number) => Promise<void>;
  removeContact: (id: number) => Promise<void>;
}

export const useContactStore = create<ContactState>((set, get) => ({
  contacts: [],
  loading: false,
  error: null,

  fetchContacts: async (companyId?: number) => {
    const where = companyId != null ? { company_id: companyId } : undefined;
    set({ loading: true, error: null });
    try {
      const data = await ContactService.findAll({
        where,
        orderBy: 'name',
        orderDirection: 'ASC',
      });
      set({ contacts: data, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load contacts';
      set({ error: message, loading: false });
      console.error('Failed to load contacts:', err);
    }
  },

  removeContact: async (id: number) => {
    try {
      await ContactService.delete(id);
      set({ contacts: get().contacts.filter((c) => c.id !== id) });
    } catch (err) {
      throw err;
    }
  },
}));
