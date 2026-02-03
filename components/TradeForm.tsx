'use client';

import { useState, type FormEvent } from 'react';
import {
  type TradeFormData,
  type Direction,
  type ExecutionGrade,
  type Outcome,
  SETUP_TYPES,
  MARKETS,
} from '@/lib/types';

/* ── helpers ─────────────────────────────────────────────────────────── */

const INPUT =
  'w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors';

const EMPTY_FORM: TradeFormData = {
  market: 'GC',
  direction: 'long',
  setup_type: '',
  entry_price: '',
  exit_price: '',
  stop_loss: '',
  take_profit: '',
  position_size: '',
  entry_time: '',
  exit_time: '',
  execution_grade: '',
  outcome: '',
  pnl: '',
  r_multiple: '',
  notes: '',
  tags: '',
};

/* ── props ───────────────────────────────────────────────────────────── */

interface TradeFormProps {
  onSubmit: (form: TradeFormData) => Promise<string | null>;
  onRuleCheck?: (tradeId: string) => void;
  defaultMarket?: string;
}

/* ── component ───────────────────────────────────────────────────────── */

export default function TradeForm({
  onSubmit,
  onRuleCheck,
  defaultMarket = 'GC',
}: TradeFormProps) {
  const [form, setForm] = useState<TradeFormData>({
    ...EMPTY_FORM,
    market: defaultMarket,
  });
  const [loading, setLoading] = useState(false);

  /* field helpers */
  const set = <K extends keyof TradeFormData>(key: K, value: TradeFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /* submit */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tradeId = await onSubmit(form);
      if (tradeId) {
        setForm({ ...EMPTY_FORM, market: defaultMarket });
        onRuleCheck?.(tradeId);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── render ──────────────────────────────────────────────────────────── */

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-2xl p-6 space-y-6"
    >
      {/* ---- Header ---- */}
      <h2 className="text-lg font-semibold text-accent">Log Trade</h2>

      {/* ---- Market ---- */}
      <fieldset>
        <label className="block text-xs font-medium text-muted mb-1.5">Market</label>
        <select
          value={form.market}
          onChange={(e) => set('market', e.target.value)}
          className={INPUT}
        >
          {MARKETS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </fieldset>

      {/* ---- Direction ---- */}
      <fieldset>
        <label className="block text-xs font-medium text-muted mb-1.5">Direction</label>
        <div className="grid grid-cols-2 gap-2">
          {(['long', 'short'] as Direction[]).map((dir) => {
            const active = form.direction === dir;
            const isLong = dir === 'long';
            return (
              <button
                key={dir}
                type="button"
                onClick={() => set('direction', dir)}
                className={`
                  rounded-lg px-4 py-2 text-sm font-semibold border transition-colors
                  ${
                    active
                      ? isLong
                        ? 'bg-green/15 border-green text-green'
                        : 'bg-red/15 border-red text-red'
                      : 'border-border text-muted hover:border-accent/40'
                  }
                `}
              >
                {dir === 'long' ? 'Long' : 'Short'}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* ---- Setup Type ---- */}
      <fieldset>
        <label className="block text-xs font-medium text-muted mb-1.5">Setup Type</label>
        <select
          value={form.setup_type}
          onChange={(e) => set('setup_type', e.target.value)}
          className={INPUT}
        >
          <option value="">Select setup...</option>
          {SETUP_TYPES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </fieldset>

      {/* ---- Entry / Exit Price ---- */}
      <div className="grid grid-cols-2 gap-3">
        <fieldset>
          <label className="block text-xs font-medium text-muted mb-1.5">Entry Price</label>
          <input
            type="number"
            step="any"
            placeholder="0.00"
            value={form.entry_price}
            onChange={(e) => set('entry_price', e.target.value)}
            className={INPUT}
          />
        </fieldset>
        <fieldset>
          <label className="block text-xs font-medium text-muted mb-1.5">Exit Price</label>
          <input
            type="number"
            step="any"
            placeholder="0.00"
            value={form.exit_price}
            onChange={(e) => set('exit_price', e.target.value)}
            className={INPUT}
          />
        </fieldset>
      </div>

      {/* ---- Stop Loss / Take Profit ---- */}
      <div className="grid grid-cols-2 gap-3">
        <fieldset>
          <label className="block text-xs font-medium text-muted mb-1.5">Stop Loss</label>
          <input
            type="number"
            step="any"
            placeholder="0.00"
            value={form.stop_loss}
            onChange={(e) => set('stop_loss', e.target.value)}
            className={INPUT}
          />
        </fieldset>
        <fieldset>
          <label className="block text-xs font-medium text-muted mb-1.5">Take Profit</label>
          <input
            type="number"
            step="any"
            placeholder="0.00"
            value={form.take_profit}
            onChange={(e) => set('take_profit', e.target.value)}
            className={INPUT}
          />
        </fieldset>
      </div>

      {/* ---- Position Size ---- */}
      <fieldset>
        <label className="block text-xs font-medium text-muted mb-1.5">Position Size</label>
        <input
          type="number"
          step="any"
          min="0"
          placeholder="1"
          value={form.position_size}
          onChange={(e) => set('position_size', e.target.value)}
          className={INPUT}
        />
      </fieldset>

      {/* ---- Entry / Exit Time ---- */}
      <div className="grid grid-cols-2 gap-3">
        <fieldset>
          <label className="block text-xs font-medium text-muted mb-1.5">Entry Time</label>
          <input
            type="datetime-local"
            value={form.entry_time}
            onChange={(e) => set('entry_time', e.target.value)}
            className={INPUT}
          />
        </fieldset>
        <fieldset>
          <label className="block text-xs font-medium text-muted mb-1.5">Exit Time</label>
          <input
            type="datetime-local"
            value={form.exit_time}
            onChange={(e) => set('exit_time', e.target.value)}
            className={INPUT}
          />
        </fieldset>
      </div>

      {/* ---- Execution Grade ---- */}
      <fieldset>
        <label className="block text-xs font-medium text-muted mb-1.5">
          Execution Grade
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(['A', 'B', 'C', 'F'] as ExecutionGrade[]).map((grade) => {
            const active = form.execution_grade === grade;
            return (
              <button
                key={grade}
                type="button"
                onClick={() => set('execution_grade', grade)}
                className={`
                  rounded-lg px-3 py-2 text-sm font-semibold border transition-colors
                  ${
                    active
                      ? 'bg-accent/15 border-accent text-accent'
                      : 'border-border text-muted hover:border-accent/40'
                  }
                `}
              >
                {grade}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* ---- Outcome ---- */}
      <fieldset>
        <label className="block text-xs font-medium text-muted mb-1.5">Outcome</label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { value: 'win', label: 'Win' },
              { value: 'loss', label: 'Loss' },
              { value: 'breakeven', label: 'BE' },
            ] as { value: Outcome; label: string }[]
          ).map(({ value, label }) => {
            const active = form.outcome === value;
            const colorMap: Record<Outcome, string> = {
              win: 'bg-green/15 border-green text-green',
              loss: 'bg-red/15 border-red text-red',
              breakeven: 'bg-accent/15 border-accent text-accent',
            };
            return (
              <button
                key={value}
                type="button"
                onClick={() => set('outcome', value)}
                className={`
                  rounded-lg px-3 py-2 text-sm font-semibold border transition-colors
                  ${
                    active
                      ? colorMap[value]
                      : 'border-border text-muted hover:border-accent/40'
                  }
                `}
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* ---- P&L ---- */}
      <fieldset>
        <label className="block text-xs font-medium text-muted mb-1.5">P&amp;L ($)</label>
        <input
          type="number"
          step="any"
          placeholder="0.00"
          value={form.pnl}
          onChange={(e) => set('pnl', e.target.value)}
          className={INPUT}
        />
      </fieldset>

      {/* ---- R Multiple ---- */}
      <fieldset>
        <label className="block text-xs font-medium text-muted mb-1.5">R Multiple</label>
        <input
          type="number"
          step="any"
          placeholder="0.0"
          value={form.r_multiple}
          onChange={(e) => set('r_multiple', e.target.value)}
          className={INPUT}
        />
      </fieldset>

      {/* ---- Notes ---- */}
      <fieldset>
        <label className="block text-xs font-medium text-muted mb-1.5">Notes</label>
        <textarea
          rows={3}
          placeholder="What did you observe? What was the context?"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          className={`${INPUT} resize-none`}
        />
      </fieldset>

      {/* ---- Tags ---- */}
      <fieldset>
        <label className="block text-xs font-medium text-muted mb-1.5">
          Tags <span className="text-muted/60">(comma separated)</span>
        </label>
        <input
          type="text"
          placeholder="e.g. AM session, trend, news"
          value={form.tags}
          onChange={(e) => set('tags', e.target.value)}
          className={INPUT}
        />
      </fieldset>

      {/* ---- Submit ---- */}
      <button
        type="submit"
        disabled={loading}
        className={`
          w-full rounded-lg py-2.5 text-sm font-semibold transition-all
          ${
            loading
              ? 'bg-accent/40 text-background/60 cursor-not-allowed'
              : 'bg-accent text-background hover:opacity-90'
          }
        `}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Saving...
          </span>
        ) : (
          'Log Trade'
        )}
      </button>
    </form>
  );
}
