import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
} from 'recharts';

/* ── Shared dark tooltip ─────────────────────────────────────────────── */
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0f1a] border border-[#1e2d3d] rounded-xl px-3 py-2.5 shadow-2xl text-[11px] min-w-[120px]">
      {label && <p className="font-bold text-slate-300 mb-1.5 border-b border-[#1e2d3d] pb-1">{label}</p>}
      {payload.map((p: any) => (
        <div key={p.dataKey || p.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.fill || p.color }} />
            <span className="text-slate-400">{p.dataKey || p.name}</span>
          </div>
          <span className="font-bold text-slate-200">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ── Footfall Bar Chart ───────────────────────────────────────────────── */
interface FootfallData { name: string; OPD: number; Emergency: number; Admission: number; Referral: number; }

const COLORS = {
  OPD:       '#0d9488',
  Emergency: '#f43f5e',
  Admission: '#8b5cf6',
  Referral:  '#f59e0b',
};

export const FootfallBarChart: React.FC<{ data: FootfallData[] }> = ({ data }) => (
  <ResponsiveContainer width="100%" height={185}>
    <BarChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }} barSize={5} barGap={1.5} barCategoryGap="28%">
      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
      <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(13,148,136,0.06)', radius: 4 }} />
      {(Object.entries(COLORS) as [string, string][]).map(([key, color]) => (
        <Bar key={key} dataKey={key} fill={color} radius={[3, 3, 0, 0]} />
      ))}
    </BarChart>
  </ResponsiveContainer>
);

/* ── Inventory Status Donut ──────────────────────────────────────────── */
const DONUT_COLORS = ['#0d9488', '#f59e0b', '#f43f5e', '#8b5cf6'];
const DONUT_LABELS = ['Normal', 'Warning', 'Critical', 'Near Expiry'];

export const InventoryStatusDonut: React.FC<{
  normal: number; warning: number; critical: number; nearExpiry: number;
}> = ({ normal, warning, critical, nearExpiry }) => {
  const data = [
    { name: 'Normal',      value: normal },
    { name: 'Warning',     value: warning },
    { name: 'Critical',    value: critical },
    { name: 'Near Expiry', value: nearExpiry },
  ].filter(d => d.value > 0);

  if (!data.length) {
    return <div className="flex items-center justify-center h-32 text-xs text-slate-500">No data</div>;
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={120}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={34} outerRadius={52} paddingAngle={4} dataKey="value" strokeWidth={0}>
            {data.map((_, idx) => {
              const ci = DONUT_LABELS.indexOf(data[idx].name);
              return <Cell key={idx} fill={DONUT_COLORS[ci] ?? DONUT_COLORS[0]} />;
            })}
          </Pie>
          <Tooltip content={<DarkTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
        {data.map(d => {
          const ci = DONUT_LABELS.indexOf(d.name);
          return (
            <div key={d.name} className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-500">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: DONUT_COLORS[ci] }} />
              {d.name}: <span className="font-bold text-slate-700 dark:text-slate-300 ml-0.5">{d.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Bed Occupancy Radial Gauge ──────────────────────────────────────── */
export const BedOccupancyGauge: React.FC<{ occupancyPct: number }> = ({ occupancyPct }) => {
  const pct   = Math.min(100, Math.max(0, occupancyPct));
  const color = pct >= 85 ? '#f43f5e' : pct >= 65 ? '#f59e0b' : '#0d9488';
  const data  = [{ name: 'Occ', value: pct, fill: color }];

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <ResponsiveContainer width={96} height={96}>
          <RadialBarChart cx="50%" cy="50%" innerRadius={28} outerRadius={44}
            startAngle={220} endAngle={-40} data={data} barSize={9}>
            <RadialBar dataKey="value" background={{ fill: 'rgba(148,163,184,0.1)' }} cornerRadius={6} />
          </RadialBarChart>
        </ResponsiveContainer>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-black tabular-nums" style={{ color }}>{Math.round(pct)}%</span>
        </div>
      </div>
    </div>
  );
};
