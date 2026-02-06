import { create } from 'zustand';
import ItemService from '../../services/itemService';
import { useBusinessStore } from './BusinessStore';
import type { Item } from '../../types/item';

interface ItemState {
  items: Item[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  removeItem: (id: number) => Promise<void>;
}

export const useItemStore = create<ItemState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchItems: async () => {
    const businessId = useBusinessStore.getState().currentBusiness?.id;
    const where = businessId != null ? { business_id: businessId } : undefined;
    set({ loading: true, error: null });
    try {
      const data = await ItemService.findAll({
        where,
        orderBy: 'name',
        orderDirection: 'ASC',
      });
      set({ items: data, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load items';
      set({ error: message, loading: false });
      console.error('Failed to load items:', err);
    }
  },

  removeItem: async (id: number) => {
    try {
      await ItemService.delete(id);
      set({ items: get().items.filter((i) => i.id !== id) });
    } catch (err) {
      throw err;
    }
  },
}));
