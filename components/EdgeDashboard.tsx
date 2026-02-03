'use client';

import { Trade } from '@/lib/types';
import { useMemo } from 'react';
import { getDay } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

// ── Theme colors ─────────────────────────────────────────────────────
const GREEN = '#22c55e';
const RED = '#ef4444';
const ACCENT = '#d4a843';
const BLUE = '#60a5fa';
const AMBER = '#fbbf24';
const AXIS_COLOR = '#6b7b8d';
const GRID_COLOR = '#1e2a3a';
const TOOLTIP_BG = '#0d1117';
const TOOLTIP_BORDER = '#1e2a3a';

const GRADE_COLORS: Record<string, string> = {
  A: GREEN,
  B: BLUE,
  C: AMBER,
  F: RED,
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Custom tooltip ───────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name?: string; value?: number; color?: string }[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        background: TOOLTIP_BG,
        border: `1px solid ${TOOLTIP_BORDER}`,
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
      }}
    >
      {label && <div style={{ color: AXIS_COLOR, marginBottom: 4 }}>{label}</div>}
      {payload.map((entry, i) => (
        <div key={i} style={{ color: entry.color || '#fff' }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
        </div>
      ))}
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────────────
interface Props {
  trades: Trade[];
}

export default function EdgeDashboard({ trades }: Props) {
  // ── 1. Win/Loss by Setup Type ────────────────────────────────────
  const setupData = useMemo(() => {
    const map: Record<string, { setup: string; wins: number; losses: number }> = {};
    for (const t of trades) {
      const key = t.setup_type || 'Unknown';
      if (!map[key]) map[key] = { setup: key, wins: 0, losses: 0 };
      if (t.outcome === 'win') map[key].wins++;
      else if (t.outcome === 'loss') map[key].losses++;
    }
    return Object.values(map).sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses));
  }, [trades]);

  // ── 2. Win/Loss by Day of Week ───────────────────────────────────
  const dayOfWeekData = useMemo(() => {
    const map: Record<number, { wins: number; total: number }> = {};
    for (let d = 1; d <= 5; d++) map[d] = { wins: 0, total: 0 };
    for (const t of trades) {
      if (!t.entry_time || !t.outcome) continue;
      const day = getDay(new Date(t.entry_time));
      if (day < 1 || day > 5) continue;
      map[day].total++;
      if (t.outcome === 'win') map[day].wins++;
    }
    return [1, 2, 3, 4, 5].map((d) => ({
      day: DAY_LABELS[d],
      winRate: map[d].total > 0 ? (map[d].wins / map[d].total) * 100 : 0,
      total: map[d].total,
    }));
  }, [trades]);

  // ── 3. Cumulative P&L Curve ──────────────────────────────────────
  const pnlCurveData = useMemo(() => {
    const sorted = [...trades]
      .filter((t) => t.entry_time)
      .sort((a, b) => new Date(a.entry_time!).getTime() - new Date(b.entry_time!).getTime());
    let cumulative = 0;
    return sorted.map((t) => {
      cumulative += t.pnl || 0;
      const d = new Date(t.entry_time!);
      return {
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        pnl: parseFloat(cumulative.toFixed(2)),
      };
    });
  }, [trades]);

  const finalPnl = pnlCurveData.length > 0 ? pnlCurveData[pnlCurveData.length - 1].pnl : 0;

  // ── 4. Execution Grade Distribution ──────────────────────────────
  const gradeData = useMemo(() => {
    const map: Record<string, number> = { A: 0, B: 0, C: 0, F: 0 };
    for (const t of trades) {
      if (t.execution_grade && map[t.execution_grade] !== undefined) {
        map[t.execution_grade]++;
      }
    }
    return Object.entries(map)
      .filter(([, count]) => count > 0)
      .map(([grade, count]) => ({ grade, count }));
  }, [trades]);

  // ── 5. R:R Distribution ──────────────────────────────────────────
  const rrDistData = useMemo(() => {
    const buckets = [
      { label: '< -2R', min: -Infinity, max: -2, count: 0 },
      { label: '-2R to -1R', min: -2, max: -1, count: 0 },
      { label: '-1R to 0R', min: -1, max: 0, count: 0 },
      { label: '0R to 1R', min: 0, max: 1, count: 0 },
      { label: '1R to 2R', min: 1, max: 2, count: 0 },
      { label: '> 2R', min: 2, max: Infinity, count: 0 },
    ];
    for (const t of trades) {
      if (t.r_multiple == null) continue;
      const r = t.r_multiple;
      for (const b of buckets) {
        if (r >= b.min && r < b.max) {
          b.count++;
          break;
        }
      }
      // Edge case: exactly at max boundary of last bucket
      if (r >= 2) buckets[5].count += 0; // already handled by Infinity
    }
    return buckets.map((b) => ({
      bucket: b.label,
      count: b.count,
      color: b.min >= 0 ? GREEN : RED,
    }));
  }, [trades]);

  // ── Empty state ──────────────────────────────────────────────────
  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 opacity-40">
          <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 16l4-8 4 4 4-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-sm font-medium">No trade data yet</p>
        <p className="text-xs mt-1">Log trades to see your edge analytics.</p>
      </div>
    );
  }

  // ── Chart card wrapper ───────────────────────────────────────────
  function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <h4 className="text-sm font-semibold mb-3">{title}</h4>
        {children}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Edge Analytics</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── 1. Win/Loss by Setup Type ───────────────────────────── */}
        <ChartCard title="Win/Loss by Setup Type">
          <ResponsiveContainer width="100%" height={setupData.length * 40 + 20} minHeight={120}>
            <BarChart data={setupData} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
              <XAxis type="number" tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="setup"
                tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                width={100}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="wins" name="Wins" fill={GREEN} radius={[0, 4, 4, 0]} stackId="stack" />
              <Bar dataKey="losses" name="Losses" fill={RED} radius={[0, 4, 4, 0]} stackId="stack" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ── 2. Win/Loss by Day of Week ─────────────────────────── */}
        <ChartCard title="Win Rate by Day of Week">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dayOfWeekData} margin={{ top: 0, right: 12, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="day" tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const wr = payload[0].value as number;
                  const total = payload[0].payload?.total ?? 0;
                  return (
                    <div style={{ background: TOOLTIP_BG, border: `1px solid ${TOOLTIP_BORDER}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                      <div style={{ color: AXIS_COLOR }}>{label}</div>
                      <div style={{ color: wr >= 50 ? GREEN : RED }}>Win Rate: {wr.toFixed(1)}%</div>
                      <div style={{ color: AXIS_COLOR }}>Trades: {total}</div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="winRate" name="Win Rate" radius={[4, 4, 0, 0]}>
                {dayOfWeekData.map((entry, i) => (
                  <Cell key={i} fill={entry.winRate >= 50 ? GREEN : RED} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ── 3. P&L Curve Over Time ─────────────────────────────── */}
        <ChartCard title="Cumulative P&L Over Time">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={pnlCurveData} margin={{ top: 4, right: 12, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="date" tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${v}`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="pnl"
                name="P&L"
                stroke={finalPnl >= 0 ? GREEN : RED}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: finalPnl >= 0 ? GREEN : RED }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ── 4. Execution Grade Distribution ────────────────────── */}
        <ChartCard title="Execution Grade Distribution">
          {gradeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={gradeData}
                  dataKey="count"
                  nameKey="grade"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  label={({ grade, count }: any) => `${grade} (${count})`}
                >
                  {gradeData.map((entry, i) => (
                    <Cell key={i} fill={GRADE_COLORS[entry.grade] || ACCENT} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const d = payload[0].payload as { grade: string; count: number };
                    return (
                      <div style={{ background: TOOLTIP_BG, border: `1px solid ${TOOLTIP_BORDER}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                        <div style={{ color: GRADE_COLORS[d.grade] || '#fff' }}>Grade {d.grade}: {d.count}</div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-xs text-muted">
              No graded trades yet
            </div>
          )}
        </ChartCard>

        {/* ── 5. R:R Distribution ────────────────────────────────── */}
        <ChartCard title="R:R Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rrDistData} margin={{ top: 0, right: 12, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="bucket" tick={{ fill: AXIS_COLOR, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Trades" radius={[4, 4, 0, 0]}>
                {rrDistData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
