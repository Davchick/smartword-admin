import { useEffect, useRef, useState } from 'react';
import { Search, X, User, CreditCard, FileText, Loader2 } from 'lucide-react';

export interface GlobalSearchResult {
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
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
  query: string;
  setQuery: (query: string) => void;
  results: GlobalSearchResult[];
  isLoading: boolean;
  error: string | null;
  onSearch: (query: string) => void;
  searchType: 'all' | 'user' | 'payment' | 'word';
  onSearchTypeChange: (type: 'all' | 'user' | 'payment' | 'word') => void;
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ru-RU', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const typeLabels = {
  user: 'Пользователи',
  payment: 'Платежи',
  word: 'Слова',
};

const typeIcons = {
  user: User,
  payment: CreditCard,
  word: FileText,
};

export function GlobalSearchModal({
  isOpen,
  onClose,
  onSelectUser,
  query,
  setQuery,
  results,
  isLoading,
  error,
  onSearch,
  searchType,
  onSearchTypeChange,
}: GlobalSearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (e.key === 'Enter' && results[selectedIndex]) {
        const result = results[selectedIndex];
        if (result.type === 'user' && result.user_id) {
          onSelectUser(result.user_id);
        }
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        const types: Array<'all' | 'user' | 'payment' | 'word'> = ['all', 'user', 'payment', 'word'];
        const currentIndex = types.indexOf(searchType);
        const nextIndex = (currentIndex + 1) % types.length;
        onSearchTypeChange(types[nextIndex]);
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, results, selectedIndex, onSelectUser, searchType, onSearchTypeChange]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value.length >= 2) {
      onSearch(value);
    }
  };

  const handleTypeChange = (type: 'all' | 'user' | 'payment' | 'word') => {
    onSearchTypeChange(type);
    if (query.length >= 2) {
      onSearch(query);
    }
  };

  const handleResultClick = (result: GlobalSearchResult) => {
    if (result.type === 'user' && result.user_id) {
      onSelectUser(result.user_id);
    }
    onClose();
  };

  const getResultTitle = (result: GlobalSearchResult): string => {
    switch (result.type) {
      case 'user':
        return result.email || result.id;
      case 'payment':
        return result.amount ? `${result.amount} ₽` : result.id;
      case 'word':
        return result.word || result.id;
      default:
        return result.id;
    }
  };

  const getResultSubtitle = (result: GlobalSearchResult): string => {
    switch (result.type) {
      case 'user':
        return `Создан ${formatDate(result.created_at)}${result.is_premium_active ? ' • Премиум' : ''}`;
      case 'payment':
        return `${result.status || ''} • ${formatDate(result.created_at)}`;
      case 'word':
        return result.translation || formatDate(result.created_at);
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="global-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="global-search-header">
          <Search size={18} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="global-search-input"
            value={query}
            onChange={handleInputChange}
            placeholder="Поиск пользователей, платежей, слов..."
          />
          {isLoading && <Loader2 size={18} className="search-loading" />}
          <button type="button" className="search-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="global-search-types">
          {(['all', 'user', 'payment', 'word'] as const).map((type) => (
            <button
              key={type}
              type="button"
              className={`search-type-btn ${searchType === type ? 'active' : ''}`}
              onClick={() => handleTypeChange(type)}
            >
              {type === 'all' ? 'Все' : typeLabels[type]}
            </button>
          ))}
        </div>

        <div className="global-search-results">
          {error && <div className="search-error">{error}</div>}

          {!error && query.length < 2 && (
            <div className="search-hint">Введите минимум 2 символа для поиска</div>
          )}

          {!error && query.length >= 2 && !isLoading && results.length === 0 && (
            <div className="search-empty">Ничего не найдено</div>
          )}

          {results.map((result, index) => {
            const Icon = typeIcons[result.type];
            return (
              <button
                key={`${result.type}-${result.id}`}
                type="button"
                className={`search-result ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleResultClick(result)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <Icon size={16} className={`search-result-icon type-${result.type}`} />
                <div className="search-result-content">
                  <span className="search-result-title">{getResultTitle(result)}</span>
                  <span className="search-result-meta">{getResultSubtitle(result)}</span>
                </div>
                <span className={`search-result-type type-${result.type}`}>
                  {typeLabels[result.type]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="global-search-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> навигация</span>
          <span><kbd>↵</kbd> выбрать</span>
          <span><kbd>Tab</kbd> тип поиска</span>
          <span><kbd>Esc</kbd> закрыть</span>
        </div>
      </div>
    </div>
  );
}