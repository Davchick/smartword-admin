import { useEffect, useRef, useMemo, useState } from 'react';
import type { ChartDataPoint } from '../types';

type Props = {
  data: ChartDataPoint[];
  metric: 'users' | 'revenue' | 'payments';
  height?: number;
};

function formatValue(value: number, metric: 'users' | 'revenue' | 'payments'): string {
  if (metric === 'revenue') {
    return `₽${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return String(value);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TrendChart({ data, metric, height = 220 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    ro.observe(container);
    setDimensions({ width: container.clientWidth, height: container.clientHeight });
    return () => ro.disconnect();
  }, [height]);

  const { path, areaPath, maxY, padding, chartHeight, chartWidth } = useMemo(() => {
    const pad = { left: 50, right: 20, top: 20, bottom: 30 };
    const cw = dimensions.width - pad.left - pad.right;
    const ch = dimensions.height - pad.top - pad.bottom;

    if (!data.length || cw <= 0 || ch <= 0) {
      return { path: '', areaPath: '', maxY: 0, padding: pad, chartHeight: 0, chartWidth: 0 };
    }

    const values = data.map((d) => d[metric]);
    const max = Math.max(...values, 1);
    const maxRounded = Math.ceil(max / 10) * 10 || 1;

    const xScaleFn = (i: number) => pad.left + (i / (data.length - 1 || 1)) * cw;
    const yScaleFn = (v: number) => pad.top + ch - (v / maxRounded) * ch;

    const pathD = data.map((d, i) => {
      const x = xScaleFn(i);
      const y = yScaleFn(d[metric]);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const areaD = pathD + ` L ${xScaleFn(data.length - 1)} ${pad.top + ch} L ${pad.left} ${pad.top + ch} Z`;

    return {
      path: pathD,
      areaPath: areaD,
      maxY: maxRounded,
      padding: pad,
      chartHeight: ch,
      chartWidth: cw,
    };
  }, [data, metric, dimensions]);

  if (!data.length) {
    return (
      <div className="chart-empty" style={{ height }}>
        Нет данных
      </div>
    );
  }

  return (
    <div ref={containerRef} className="trend-chart" style={{ height }}>
      <svg width={dimensions.width} height={dimensions.height}>
        <defs>
          <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g className="chart-grid">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + chartHeight * ratio;
            return (
              <line
                key={ratio}
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke="var(--border-subtle)"
                strokeWidth="1"
              />
            );
          })}
        </g>

        <g className="chart-y-axis">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const value = maxY * (1 - ratio);
            const y = padding.top + chartHeight * ratio;
            return (
              <text
                key={i}
                x={padding.left - 8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="12"
                fill="var(--text-subtle)"
              >
                {formatValue(value, metric)}
              </text>
            );
          })}
        </g>

        <g className="chart-x-axis">
          {data.filter((_, i) => i % Math.ceil(data.length / 5) === 0).map((d) => {
            const idx = data.indexOf(d);
            const x = padding.left + (idx / (data.length - 1 || 1)) * chartWidth;
            return (
              <text
                key={d.date}
                x={x}
                y={dimensions.height - 8}
                textAnchor="middle"
                fontSize="12"
                fill="var(--text-subtle)"
              >
                {formatDate(d.date)}
              </text>
            );
          })}
        </g>

        <path d={areaPath} fill={`url(#gradient-${metric})`} />
        <path
          d={path}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {data.filter((_, i) => i % Math.ceil(data.length / 10) === 0).map((d, i) => {
            const x = padding.left + (i * Math.ceil(data.length / 10) / (data.length - 1 || 1)) * chartWidth;
            const y = padding.top + chartHeight - (d[metric] / maxY) * chartHeight;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="4"
                fill="var(--surface)"
                stroke="var(--accent)"
                strokeWidth="2"
              />
            );
          })}
      </svg>
    </div>
  );
}