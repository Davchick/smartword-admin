import { useCallback, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface UseAdminUIOptions {
  defaultTab?: string;
}

export function useAdminUI(options: UseAdminUIOptions = {}) {
  const [activeTab, setActiveTab] = useState(options.defaultTab ?? 'overview');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  const toggleSearch = useCallback(() => setIsSearchOpen((prev) => !prev), []);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showSuccess = useCallback((message: string) => addToast(message, 'success'), [addToast]);
  const showError = useCallback((message: string) => addToast(message, 'error'), [addToast]);
  const showInfo = useCallback((message: string) => addToast(message, 'info'), [addToast]);

  const setTab = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  return {
    activeTab,
    setTab,
    isSearchOpen,
    openSearch,
    closeSearch,
    toggleSearch,
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
  };
}