type BarChartProps = {
  data: { label: string; value: number; color?: string }[];
  height?: number;
};

export function BarChart({ data, height = 180 }: BarChartProps) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barWidth = 100 / (data.length * 1.5);
  const gap = barWidth * 0.5;

  return (
    <div className="w-full">
      <div className="relative flex items-end justify-around" style={{ height }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <div
            key={t}
            className="absolute left-0 right-0 border-t border-dashed border-gray-100"
            style={{ bottom: `${t * 100}%` }}
          />
        ))}
        {data.map((d, i) => {
          const h = (d.value / maxVal) * (height - 30);
          return (
            <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1.5" style={{ maxWidth: `${barWidth * 2}%` }}>
              <span className="text-xs font-semibold text-gray-700">{d.value}</span>
              <div
                className="w-full max-w-[36px] rounded-t-lg transition-all duration-700 ease-out hover:opacity-80"
                style={{
                  height: `${Math.max(h, 4)}px`,
                  background: d.color ?? 'linear-gradient(to top, #1e3a8a, #3b82f6)',
                }}
              />
              <span className="max-w-full truncate text-[10px] text-gray-400">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type DonutChartProps = {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
};

export function DonutChart({ data, size = 160, thickness = 28 }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
          {total > 0 && data.map((d, i) => {
            const len = (d.value / total) * circumference;
            const dash = `${len} ${circumference - len}`;
            const seg = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            );
            offset += len;
            return seg;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{total}</span>
          <span className="text-[10px] text-gray-400">Total</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-gray-600">{d.label}</span>
            <span className="ml-auto font-semibold text-gray-900">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type LineChartProps = {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
};

export function LineChart({ data, height = 160, color = '#1e3a8a' }: LineChartProps) {
  if (data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const width = 100;
  const points = data.map((d, i) => {
    const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width;
    const y = height - 20 - (d.value / maxVal) * (height - 40);
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - 20} L ${points[0].x} ${height - 20} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map(t => (
          <line key={t} x1="0" y1={height - 20 - t * (height - 40)} x2={width} y2={height - 20 - t * (height - 40)} stroke="#f1f5f9" strokeWidth="0.3" strokeDasharray="1 1" />
        ))}
        <path d={areaD} fill="url(#lineGrad)" />
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={color} />
        ))}
      </svg>
      <div className="mt-1 flex justify-between px-1">
        {data.map((d, i) => (
          <span key={i} className="text-[10px] text-gray-400">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

type ProgressRingProps = {
  value: number;
  max: number;
  size?: number;
  thickness?: number;
  color?: string;
  label?: string;
};

export function ProgressRing({ value, max, size = 80, thickness = 8, color = '#22c55e', label }: ProgressRingProps) {
  const pct = max > 0 ? value / max : 0;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = `${pct * circumference} ${circumference}`;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeDasharray={dash}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-900">{Math.round(pct * 100)}%</span>
        </div>
      </div>
      {label && <span className="text-[10px] text-gray-400">{label}</span>}
    </div>
  );
}
