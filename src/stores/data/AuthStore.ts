import { create } from 'zustand';
import { persist, PersistStorage, StorageValue } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { SessionUser } from '../../types/Types';

// Define User type
interface AuthState {
  sessionUser: SessionUser | null;
  accessToken: string | null;
  login: (userData: SessionUser) => void;
  logout: () => void;
  hasRole: (roleKey: string) => boolean;
  hasAnyRole: (roleKeys: string[]) => boolean;
  isAdmin: () => boolean;
}

// Custom storage object to handle localStorage operations
const storage: PersistStorage<AuthState> = {
  getItem: (key: string) => {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as StorageValue<AuthState>) : null;
  },
  setItem: (key: string, value: StorageValue<AuthState>) => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key);
  },
};

// Normalize role_key for consistent comparison (backend uses lowercase)
const normalizeRoleKey = (key: string) => (key || '').toLowerCase().trim();

// Zustand store with persistence (stores user data in localStorage)
const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      sessionUser: null,
      accessToken: null,
      login: (userData: SessionUser) => {
        set({ sessionUser: userData });
        set({ accessToken: userData.accessToken });
      },
      logout: () => {
        set({ sessionUser: null });
        set({ accessToken: null });
        toast.success('Logout successful');
      },
      hasRole: (roleKey: string) => {
        const user = get().sessionUser;
        if (!user) return false;
        const key = normalizeRoleKey(roleKey);
        if (user.roles?.length) {
          return user.roles.some((r) => normalizeRoleKey(r.role_key) === key);
        }
        return normalizeRoleKey(user.role) === key;
      },
      hasAnyRole: (roleKeys: string[]) => {
        const user = get().sessionUser;
        if (!user) return false;
        const keys = roleKeys.map(normalizeRoleKey).filter(Boolean);
        if (user.roles?.length) {
          if (user.roles.some((r) => keys.includes(normalizeRoleKey(r.role_key)))) return true;
        }
        return keys.includes(normalizeRoleKey(user.role));
      },
      isAdmin: () => {
        const user = get().sessionUser;
        if (!user) return false;
        if (user.is_admin === true) return true;
        return get().hasAnyRole(['secretary', 'scholar_admin', 'Scholar_admin', 'scholar_owner', 'Scholar Owner']);
      },
    }),
    {
      name: 'auth',
      storage,
      partialize: (state) => ({
        sessionUser: state.sessionUser,
        accessToken: state.accessToken,
      }),
    }
  )
);

export default useAuthStore;
