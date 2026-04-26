import { useState } from 'react';
import type { Period, PeriodOrCustom, DateRange } from '../types';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: '7d', label: '7 дней' },
  { value: '30d', label: '30 дней' },
  { value: '90d', label: '90 дней' },
];

export function isCustomPeriodValue(period: PeriodOrCustom): period is { type: 'custom'; range: DateRange } {
  return typeof period === 'object' && period !== null && 'type' in period && period.type === 'custom';
}

type Props = {
  value: PeriodOrCustom;
  onChange: (period: PeriodOrCustom) => void;
};

export function PeriodSelector({ value, onChange }: Props) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const isCustom = isCustomPeriodValue(value);

  const handlePresetClick = (period: Period) => {
    onChange(period);
    setShowCustomPicker(false);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      if (start <= end) {
        onChange({
          type: 'custom',
          range: {
            start: customStart,
            end: customEnd,
          },
        });
        setShowCustomPicker(false);
      }
    }
  };

  const handleCustomClear = () => {
    onChange('30d');
    setShowCustomPicker(false);
    setCustomStart('');
    setCustomEnd('');
  };

  const formatCustomRange = (range: DateRange): string => {
    const formatDate = (d: string) => {
      const date = new Date(d);
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    };
    return `${formatDate(range.start)} - ${formatDate(range.end)}`;
  };

  return (
    <div className="period-selector-container">
      <div className="period-selector">
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`period-option ${!isCustom && value === option.value ? 'active' : ''}`}
            onClick={() => handlePresetClick(option.value)}
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          className={`period-option ${isCustom ? 'active' : ''}`}
          onClick={() => setShowCustomPicker(!showCustomPicker)}
        >
          📅 {isCustom ? formatCustomRange(value.range) : 'Свой период'}
        </button>
      </div>

      {showCustomPicker && (
        <div className="custom-period-picker">
          <div className="custom-period-presets">
            <button
              type="button"
              className="preset-btn"
              onClick={() => {
                const now = new Date();
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                setCustomStart(weekAgo.toISOString().split('T')[0]);
                setCustomEnd(now.toISOString().split('T')[0]);
              }}
            >
              Прошлая неделя
            </button>
            <button
              type="button"
              className="preset-btn"
              onClick={() => {
                const now = new Date();
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                setCustomStart(monthAgo.toISOString().split('T')[0]);
                setCustomEnd(now.toISOString().split('T')[0]);
              }}
            >
              Прошлый месяц
            </button>
            <button
              type="button"
              className="preset-btn"
              onClick={() => {
                const now = new Date();
                const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                setCustomStart(yearAgo.toISOString().split('T')[0]);
                setCustomEnd(now.toISOString().split('T')[0]);
              }}
            >
              Прошлый год
            </button>
          </div>
          <div className="custom-period-inputs">
            <div className="date-input-group">
              <label>С:</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="date-input-group">
              <label>По:</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="form-input"
              />
            </div>
          </div>
          <div className="custom-period-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleCustomClear}>
              Сбросить
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleCustomApply}
              disabled={!customStart || !customEnd}
            >
              Применить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}