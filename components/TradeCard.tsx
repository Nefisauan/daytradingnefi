'use client';

import { Trade } from '@/lib/types';
import { format } from 'date-fns';

interface Props {
  trade: Trade;
  onClick?: (trade: Trade) => void;
}

const GRADE_COLORS: Record<string, string> = {
  A: 'text-green bg-green/10',
  B: 'text-blue-400 bg-blue-400/10',
  C: 'text-amber-400 bg-amber-400/10',
  F: 'text-red bg-red/10',
};

export default function TradeCard({ trade, onClick }: Props) {
  const isWin = trade.outcome === 'win';
  const isLoss = trade.outcome === 'loss';
  const pnlColor = isWin ? 'text-green' : isLoss ? 'text-red' : 'text-muted';
  const dirColor = trade.direction === 'long' ? 'text-green' : 'text-red';

  return (
    <button
      onClick={() => onClick?.(trade)}
      className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-accent/30 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-0.5 rounded">
            {trade.market}
          </span>
          <span className={`text-xs font-semibold uppercase ${dirColor}`}>
            {trade.direction}
          </span>
          <span className="text-xs text-muted bg-background px-2 py-0.5 rounded">
            {trade.setup_type}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {trade.execution_grade && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${GRADE_COLORS[trade.execution_grade] || 'text-muted'}`}>
              {trade.execution_grade}
            </span>
          )}
          {trade.outcome && (
            <span className={`text-xs font-semibold uppercase ${pnlColor}`}>
              {trade.outcome === 'breakeven' ? 'BE' : trade.outcome}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 text-xs">
        <div>
          <div className="text-muted mb-0.5">Entry</div>
          <div className="font-mono">{trade.entry_price ?? '-'}</div>
        </div>
        <div>
          <div className="text-muted mb-0.5">Exit</div>
          <div className="font-mono">{trade.exit_price ?? '-'}</div>
        </div>
        <div>
          <div className="text-muted mb-0.5">P&L</div>
          <div className={`font-mono font-semibold ${pnlColor}`}>
            {trade.pnl != null ? (trade.pnl >= 0 ? '+' : '') + trade.pnl.toFixed(2) : '-'}
          </div>
        </div>
        <div>
          <div className="text-muted mb-0.5">R</div>
          <div className={`font-mono ${pnlColor}`}>
            {trade.r_multiple != null ? (trade.r_multiple >= 0 ? '+' : '') + trade.r_multiple.toFixed(1) + 'R' : '-'}
          </div>
        </div>
      </div>

      {trade.entry_time && (
        <div className="mt-2 text-xs text-muted">
          {format(new Date(trade.entry_time), 'MMM d, yyyy h:mm a')}
        </div>
      )}

      {trade.notes && (
        <p className="mt-2 text-xs text-muted line-clamp-2">{trade.notes}</p>
      )}
    </button>
  );
}
