'use client';

import { useState } from 'react';
import {
  PotentialTradeFormData,
  MissedReason,
  Direction,
  MarketType,
  SETUP_TYPES,
  MARKETS,
} from '@/lib/types';

interface Props {
  onSubmit: (form: PotentialTradeFormData) => Promise<string | null>;
  defaultMarket?: MarketType;
}

const MISSED_REASONS: MissedReason[] = ['Hesitation', 'Doubt', 'Distraction', 'Missed signal'];

export default function PotentialTradeForm({ onSubmit, defaultMarket = 'GC' }: Props) {
  const [form, setForm] = useState<PotentialTradeFormData>({
    market: defaultMarket,
    direction: 'long',
    setup_type: SETUP_TYPES[0],
    entry_price: '',
    exit_price: '',
    stop_loss: '',
    take_profit: '',
    potential_pnl: '',
    r_multiple: '',
    entry_time: '',
    reason: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (key: keyof PotentialTradeFormData, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const id = await onSubmit(form);
    setLoading(false);
    if (id) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setForm({
        market: defaultMarket,
        direction: 'long',
        setup_type: SETUP_TYPES[0],
        entry_price: '',
        exit_price: '',
        stop_loss: '',
        take_profit: '',
        potential_pnl: '',
        r_multiple: '',
        entry_time: '',
        reason: '',
        notes: '',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">Log Potential Trade</h3>
      <p className="text-xs text-muted">Log setups you spotted but didn&apos;t take.</p>

      {/* Market & Direction */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">Market</label>
          <select
            value={form.market}
            onChange={(e) => update('market', e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          >
            {MARKETS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Direction</label>
          <div className="flex gap-2">
            {(['long', 'short'] as Direction[]).map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => update('direction', dir)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all capitalize ${
                  form.direction === dir
                    ? dir === 'long'
                      ? 'border-green/40 bg-green/10 text-green'
                      : 'border-red/40 bg-red/10 text-red'
                    : 'border-border bg-background text-muted hover:text-foreground'
                }`}
              >
                {dir}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Setup type */}
      <div>
        <label className="block text-xs text-muted mb-1">Setup Type</label>
        <select
          value={form.setup_type}
          onChange={(e) => update('setup_type', e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
        >
          {SETUP_TYPES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">Entry Price</label>
          <input
            type="number"
            step="any"
            value={form.entry_price}
            onChange={(e) => update('entry_price', e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent"
            placeholder="2045.50"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Where It Went (Exit)</label>
          <input
            type="number"
            step="any"
            value={form.exit_price}
            onChange={(e) => update('exit_price', e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent"
            placeholder="2052.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">Stop Loss</label>
          <input
            type="number"
            step="any"
            value={form.stop_loss}
            onChange={(e) => update('stop_loss', e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent"
            placeholder="2043.00"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Take Profit</label>
          <input
            type="number"
            step="any"
            value={form.take_profit}
            onChange={(e) => update('take_profit', e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent"
            placeholder="2055.00"
          />
        </div>
      </div>

      {/* P&L and R */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">Potential P&L ($)</label>
          <input
            type="number"
            step="any"
            value={form.potential_pnl}
            onChange={(e) => update('potential_pnl', e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent"
            placeholder="650.00"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">R Multiple</label>
          <input
            type="number"
            step="any"
            value={form.r_multiple}
            onChange={(e) => update('r_multiple', e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent"
            placeholder="2.5"
          />
        </div>
      </div>

      {/* Time */}
      <div>
        <label className="block text-xs text-muted mb-1">When did the setup occur?</label>
        <input
          type="datetime-local"
          value={form.entry_time}
          onChange={(e) => update('entry_time', e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
      </div>

      {/* Reason for not taking */}
      <div>
        <label className="block text-xs text-muted mb-1.5">Why didn&apos;t you take it?</label>
        <div className="grid grid-cols-2 gap-2">
          {MISSED_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => update('reason', reason)}
              className={`py-2.5 rounded-lg border text-xs font-medium transition-all ${
                form.reason === reason
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-background text-muted hover:text-foreground'
              }`}
            >
              {reason}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs text-muted mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
          rows={2}
          placeholder="What was the setup? What did you see but not act on?"
        />
      </div>

      {success && (
        <div className="text-sm text-green bg-green/10 rounded-lg px-3 py-2">
          Potential trade logged.
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-accent text-background font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Log Potential Trade'}
      </button>
    </form>
  );
}
