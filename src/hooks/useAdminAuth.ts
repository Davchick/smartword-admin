import { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '../api';
import type { AdminConfig } from '../types';

const STORAGE_KEYS = {
  email: 'adminEmail',
} as const;

function loadFromStorage(key: string): string | null {
  try {
    const value = localStorage.getItem(key);
    if (typeof value !== 'string') return null;
    const decoded = atob(value);
    if (!/^[\x20-\x7E]*$/.test(decoded)) return null;
    return decoded || null;
  } catch {
    return null;
  }
}


function saveToStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, btoa(value));
  } catch {
    // Storage unavailable or value too large
  }
}


function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export interface AuthState {
  email: string;
  token: string;
  isAuthorized: boolean;
  isLoading: boolean;
}

export interface AuthActions {
  login: (email: string, token: string) => void;
  logout: () => void;
  validateAuth: () => Promise<boolean>;
}

export function useAdminAuth(): AuthState & AuthActions {
  const [email, setEmail] = useState(() => loadFromStorage(STORAGE_KEYS.email) ?? '');
  const [token, setToken] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (email) {
      saveToStorage(STORAGE_KEYS.email, email);
    } else {
      removeFromStorage(STORAGE_KEYS.email);
    }
  }, [email]);

  const login = useCallback((newEmail: string, newToken: string) => {
    setEmail(newEmail);
    setToken(newToken);
    setIsAuthorized(true);
  }, []);

  const logout = useCallback(() => {
    setEmail('');
    setToken('');
    setIsAuthorized(false);
    removeFromStorage(STORAGE_KEYS.email);
  }, []);

  const validateAuth = useCallback(async (): Promise<boolean> => {
    if (!token || !email) return false;
    setIsLoading(true);
    try {
      await adminFetch('/overview', { token, email }, { method: 'HEAD' });
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [token, email]);

  const setEmailState = setEmail;
  const setTokenState = setToken;

  return {
    email,
    token,
    isAuthorized,
    isLoading,
    login,
    logout,
    validateAuth,
    setEmail: setEmailState,
    setToken: setTokenState,
  };
}

export function useAdminConfig(token: string, email: string): AdminConfig {
  return { token, email };
}

export type GlobalSearchResult = {
  type: 'user' | 'payment' | 'word';
  id: string;
  user_id?: string;
  email?: string;
  word?: string;
  translation?: string;
  amount?: number;
  status?: string;
  created_at: string;
  is_premium_active?: boolean;
};

export function useGlobalSearch(config: AdminConfig) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<'all' | 'user' | 'payment' | 'word'>('all');

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const typeParam = searchType !== 'all' ? `&type=${searchType}` : '';
      const data = await adminFetch<{ results: GlobalSearchResult[] }>(
        `/search/global?q=${encodeURIComponent(searchQuery)}${typeParam}`,
        config,
      );
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [config, searchType]);

  return { query, setQuery, results, isLoading, error, search, searchType, setSearchType };
}