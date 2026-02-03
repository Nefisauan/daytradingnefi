'use client';

import { useState } from 'react';
import { Trade, SETUP_TYPES } from '@/lib/types';
import TradeCard from './TradeCard';

interface Props {
  trades: Trade[];
  onTradeClick?: (trade: Trade) => void;
}

export default function TradeLog({ trades, onTradeClick }: Props) {
  const [setupFilter, setSetupFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = trades.filter((t) => {
    if (setupFilter && t.setup_type !== setupFilter) return false;
    if (outcomeFilter && t.outcome !== outcomeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.market.toLowerCase().includes(q) ||
        t.setup_type.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search trades..."
          className="flex-1 min-w-[160px] bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
        />
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
          value={outcomeFilter}
          onChange={(e) => setOutcomeFilter(e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
        >
          <option value="">All Outcomes</option>
          <option value="win">Wins</option>
          <option value="loss">Losses</option>
          <option value="breakeven">Breakeven</option>
        </select>
      </div>

      {/* Count */}
      <div className="text-sm text-muted">
        {filtered.length} trade{filtered.length !== 1 ? 's' : ''}
        {(setupFilter || outcomeFilter || searchQuery) ? ' (filtered)' : ''}
      </div>

      {/* Trade list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p className="text-lg mb-1">No trades found</p>
          <p className="text-sm">
            {trades.length === 0 ? 'Log your first trade to get started.' : 'Try adjusting your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((trade) => (
            <TradeCard key={trade.id} trade={trade} onClick={onTradeClick} />
          ))}
        </div>
      )}
    </div>
  );
}
