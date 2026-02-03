'use client';

import { Trade, DashboardStatsData } from '@/lib/types';
import { useMemo } from 'react';
import { format } from 'date-fns';

interface Props {
  trades: Trade[];
}

function computeStats(trades: Trade[]): DashboardStatsData {
  if (trades.length === 0) {
    return { totalTrades: 0, winRate: 0, avgRR: 0, totalPnl: 0, bestDay: null, worstDay: null, profitFactor: 0, avgWin: 0, avgLoss: 0 };
  }

  const wins = trades.filter((t) => t.outcome === 'win');
  const losses = trades.filter((t) => t.outcome === 'loss');
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;

  const rMultiples = trades.filter((t) => t.r_multiple != null).map((t) => t.r_multiple!);
  const avgRR = rMultiples.length > 0 ? rMultiples.reduce((a, b) => a + b, 0) / rMultiples.length : 0;

  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);

  const winPnls = wins.map((t) => t.pnl || 0).filter((p) => p > 0);
  const lossPnls = losses.map((t) => Math.abs(t.pnl || 0)).filter((p) => p > 0);
  const avgWin = winPnls.length > 0 ? winPnls.reduce((a, b) => a + b, 0) / winPnls.length : 0;
  const avgLoss = lossPnls.length > 0 ? lossPnls.reduce((a, b) => a + b, 0) / lossPnls.length : 0;
  const profitFactor = avgLoss > 0 ? (winPnls.reduce((a, b) => a + b, 0)) / (lossPnls.reduce((a, b) => a + b, 0)) : 0;

  // Best/worst day
  const dayMap: Record<string, number> = {};
  for (const t of trades) {
    const d = t.entry_time ? format(new Date(t.entry_time), 'yyyy-MM-dd') : t.created_at.split('T')[0];
    dayMap[d] = (dayMap[d] || 0) + (t.pnl || 0);
  }
  const days = Object.entries(dayMap);
  const bestDay = days.length > 0 ? days.reduce((a, b) => (b[1] > a[1] ? b : a)) : null;
  const worstDay = days.length > 0 ? days.reduce((a, b) => (b[1] < a[1] ? b : a)) : null;

  return {
    totalTrades: trades.length,
    winRate,
    avgRR,
    totalPnl,
    bestDay: bestDay ? { date: bestDay[0], pnl: bestDay[1] } : null,
    worstDay: worstDay ? { date: worstDay[0], pnl: worstDay[1] } : null,
    profitFactor,
    avgWin,
    avgLoss,
  };
}

function StatCard({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className={`text-xl font-bold font-mono ${color || 'text-foreground'}`}>{value}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  );
}

export default function DashboardStats({ trades }: Props) {
  const stats = useMemo(() => computeStats(trades), [trades]);

  const pnlColor = stats.totalPnl >= 0 ? 'text-green' : 'text-red';

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Performance Summary</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Trades" value={String(stats.totalTrades)} />
        <StatCard
          label="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          color={stats.winRate >= 50 ? 'text-green' : 'text-red'}
        />
        <StatCard
          label="Avg R:R"
          value={stats.avgRR.toFixed(2) + 'R'}
          color={stats.avgRR >= 0 ? 'text-green' : 'text-red'}
        />
        <StatCard
          label="Total P&L"
          value={(stats.totalPnl >= 0 ? '+' : '') + stats.totalPnl.toFixed(2)}
          color={pnlColor}
        />
        <StatCard
          label="Profit Factor"
          value={stats.profitFactor.toFixed(2)}
          color={stats.profitFactor >= 1 ? 'text-green' : 'text-red'}
        />
        <StatCard
          label="Avg Win"
          value={'+' + stats.avgWin.toFixed(2)}
          color="text-green"
        />
        <StatCard
          label="Avg Loss"
          value={'-' + stats.avgLoss.toFixed(2)}
          color="text-red"
        />
        <StatCard
          label="Best Day"
          value={stats.bestDay ? '+' + stats.bestDay.pnl.toFixed(2) : '-'}
          color="text-green"
          sub={stats.bestDay?.date || ''}
        />
      </div>
    </div>
  );
}
