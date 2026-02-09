'use client';

import { useState } from 'react';
import { PotentialTrade, SETUP_TYPES } from '@/lib/types';
import { format } from 'date-fns';
import ScreenshotUpload from './ScreenshotUpload';

interface Props {
  trades: PotentialTrade[];
  userId: string;
  supabase: any;
  onDelete?: (id: string) => void;
}

const REASON_COLORS: Record<string, string> = {
  Hesitation: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
  Doubt: 'bg-red/10 text-red border-red/30',
  Distraction: 'bg-purple-400/10 text-purple-400 border-purple-400/30',
  'Missed signal': 'bg-blue-400/10 text-blue-400 border-blue-400/30',
};

export default function PotentialTradeLog({ trades, userId, supabase, onDelete }: Props) {
  const [setupFilter, setSetupFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = trades.filter((t) => {
    if (setupFilter && t.setup_type !== setupFilter) return false;
    if (reasonFilter && t.reason !== reasonFilter) return false;
    return true;
  });

  // Stats
  const totalPotentialPnl = trades.reduce((sum, t) => sum + (t.potential_pnl || 0), 0);
  const avgPotentialPnl = trades.length > 0 ? totalPotentialPnl / trades.length : 0;
  const reasonCounts: Record<string, number> = {};
  for (const t of trades) {
    if (t.reason) {
      reasonCounts[t.reason] = (reasonCounts[t.reason] || 0) + 1;
    }
  }
  const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-4">
      {/* ── Potential P&L Summary ─────────────────────────────────── */}
      {trades.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-xl p-3">
            <div className="text-xs text-muted mb-0.5">Missed Trades</div>
            <div className="text-lg font-bold">{trades.length}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-3">
            <div className="text-xs text-muted mb-0.5">Potential P&L</div>
            <div className={`text-lg font-bold font-mono ${totalPotentialPnl >= 0 ? 'text-green' : 'text-red'}`}>
              {totalPotentialPnl >= 0 ? '+' : ''}${totalPotentialPnl.toFixed(2)}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-3">
            <div className="text-xs text-muted mb-0.5">Avg Missed P&L</div>
            <div className={`text-lg font-bold font-mono ${avgPotentialPnl >= 0 ? 'text-green' : 'text-red'}`}>
              {avgPotentialPnl >= 0 ? '+' : ''}${avgPotentialPnl.toFixed(2)}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-3">
            <div className="text-xs text-muted mb-0.5">Top Reason</div>
            <div className="text-sm font-semibold">
              {topReason ? `${topReason[0]} (${topReason[1]})` : '-'}
            </div>
          </div>
        </div>
      )}

      {/* ── Filters ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <select
          value={setupFilter}
          onChange={(e) => setSetupFilter(e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
        >
          <option value="">All Setups</option>
          {SETUP_TYPES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={reasonFilter}
          onChange={(e) => setReasonFilter(e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
        >
          <option value="">All Reasons</option>
          <option value="Hesitation">Hesitation</option>
          <option value="Doubt">Doubt</option>
          <option value="Distraction">Distraction</option>
          <option value="Missed signal">Missed signal</option>
        </select>
      </div>

      <div className="text-sm text-muted">
        {filtered.length} potential trade{filtered.length !== 1 ? 's' : ''}
        {(setupFilter || reasonFilter) ? ' (filtered)' : ''}
      </div>

      {/* ── Trade List ───────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p className="text-lg mb-1">No potential trades logged</p>
          <p className="text-sm">Log setups you spotted but didn&apos;t take to track what you&apos;re leaving on the table.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((trade) => {
            const dirColor = trade.direction === 'long' ? 'text-green' : 'text-red';
            const pnlColor = (trade.potential_pnl || 0) >= 0 ? 'text-green' : 'text-red';
            const isExpanded = expandedId === trade.id;

            return (
              <div key={trade.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : trade.id)}
                  className="w-full p-3 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-0.5 rounded">
                        {trade.market}
                      </span>
                      <span className={`text-xs font-semibold uppercase ${dirColor}`}>
                        {trade.direction}
                      </span>
                      <span className="text-xs text-muted bg-background px-2 py-0.5 rounded">
                        {trade.setup_type}
                      </span>
                      {trade.reason && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${REASON_COLORS[trade.reason] || 'text-muted'}`}>
                          {trade.reason}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {trade.potential_pnl != null && (
                        <span className={`text-sm font-mono font-semibold ${pnlColor}`}>
                          {trade.potential_pnl >= 0 ? '+' : ''}${trade.potential_pnl.toFixed(2)}
                        </span>
                      )}
                      <svg
                        width="12" height="12" viewBox="0 0 12 12" fill="none"
                        className={`text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      >
                        <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-1.5 text-xs text-muted">
                    {trade.entry_price && (
                      <span>Entry: <span className="font-mono">{trade.entry_price}</span></span>
                    )}
                    {trade.exit_price && (
                      <span>Exit: <span className="font-mono">{trade.exit_price}</span></span>
                    )}
                    {trade.r_multiple != null && (
                      <span className={pnlColor}>{trade.r_multiple >= 0 ? '+' : ''}{trade.r_multiple.toFixed(1)}R</span>
                    )}
                    {trade.entry_time && (
                      <span>{format(new Date(trade.entry_time), 'MMM d, h:mm a')}</span>
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border p-3 space-y-3">
                    {trade.notes && (
                      <p className="text-xs text-muted">{trade.notes}</p>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {trade.stop_loss && (
                        <div>
                          <span className="text-muted">Stop Loss: </span>
                          <span className="font-mono">{trade.stop_loss}</span>
                        </div>
                      )}
                      {trade.take_profit && (
                        <div>
                          <span className="text-muted">Take Profit: </span>
                          <span className="font-mono">{trade.take_profit}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-muted mb-2">Screenshots</p>
                      <ScreenshotUpload
                        tradeId={trade.id}
                        userId={userId}
                        supabase={supabase}
                      />
                    </div>

                    {onDelete && (
                      <button
                        onClick={() => onDelete(trade.id)}
                        className="text-[10px] text-red/60 hover:text-red transition-colors"
                      >
                        Delete this entry
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
