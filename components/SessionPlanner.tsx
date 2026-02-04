'use client';

import { useState } from 'react';
import { SessionPlanFormData, MarketBias } from '@/lib/types';

interface Props {
  onSubmit: (form: SessionPlanFormData) => Promise<void>;
  initialData?: Partial<SessionPlanFormData>;
}

const BIAS_OPTIONS: { value: MarketBias; label: string; color: string }[] = [
  { value: 'bullish', label: 'Bullish', color: 'border-green/40 bg-green/10 text-green' },
  { value: 'neutral', label: 'Neutral', color: 'border-muted/40 bg-muted/10 text-muted' },
  { value: 'bearish', label: 'Bearish', color: 'border-red/40 bg-red/10 text-red' },
];

export default function SessionPlanner({ onSubmit, initialData }: Props) {
  const [form, setForm] = useState<SessionPlanFormData>({
    market_bias: initialData?.market_bias || '',
    htf_levels: initialData?.htf_levels || '',
    ltf_levels: initialData?.ltf_levels || '',
    liquidity_zones: initialData?.liquidity_zones || '',
    max_trades: initialData?.max_trades || '3',
    notes: initialData?.notes || '',
  });
  const [lookingFor, setLookingFor] = useState('');
  const [willNotTrade, setWillNotTrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (key: keyof SessionPlanFormData, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Append intent prompts to notes
    const extraParts: string[] = [];
    if (lookingFor) extraParts.push(`[Looking For] ${lookingFor}`);
    if (willNotTrade) extraParts.push(`[Will NOT Trade If] ${willNotTrade}`);
    const combinedNotes = [form.notes, ...extraParts].filter(Boolean).join('\n');

    await onSubmit({ ...form, notes: combinedNotes });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h3 className="text-lg font-semibold">Pre-Market Session Plan</h3>
      <p className="text-sm text-muted">Plan your session before the market opens.</p>

      {/* Session Intent */}
      <div className="bg-card border border-accent/20 rounded-xl p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            &quot;Today I&apos;m looking for...&quot;
          </label>
          <textarea
            value={lookingFor}
            onChange={(e) => setLookingFor(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
            rows={2}
            placeholder="e.g. A sweep of BSL into a bearish OB on the 15m with a CHoCH entry on the 1m"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            &quot;I will NOT trade if...&quot;
          </label>
          <textarea
            value={willNotTrade}
            onChange={(e) => setWillNotTrade(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
            rows={2}
            placeholder="e.g. CPI drops at 8:30, or if I feel frustrated from yesterday's losses"
          />
        </div>
      </div>

      {/* Market Bias */}
      <div>
        <label className="block text-sm text-muted mb-2">Market Bias</label>
        <div className="flex gap-2">
          {BIAS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update('market_bias', opt.value)}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                form.market_bias === opt.value ? opt.color : 'border-border bg-card'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* HTF Levels */}
      <div>
        <label className="block text-sm text-muted mb-1">
          Higher Timeframe Key Levels
          <span className="text-xs ml-1">(one per line: Label @ Price)</span>
        </label>
        <textarea
          value={form.htf_levels}
          onChange={(e) => update('htf_levels', e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent resize-none"
          rows={3}
          placeholder={"Daily resistance @ 2045\nWeekly support @ 2020"}
        />
      </div>

      {/* LTF Levels */}
      <div>
        <label className="block text-sm text-muted mb-1">
          Lower Timeframe Key Levels
          <span className="text-xs ml-1">(one per line: Label @ Price)</span>
        </label>
        <textarea
          value={form.ltf_levels}
          onChange={(e) => update('ltf_levels', e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent resize-none"
          rows={3}
          placeholder={"15m FVG @ 2038\n5m OB @ 2032"}
        />
      </div>

      {/* Liquidity Zones */}
      <div>
        <label className="block text-sm text-muted mb-1">
          Liquidity Zones
          <span className="text-xs ml-1">(one per line: Start - End - Label)</span>
        </label>
        <textarea
          value={form.liquidity_zones}
          onChange={(e) => update('liquidity_zones', e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent resize-none"
          rows={2}
          placeholder="2040 - 2042 - BSL cluster"
        />
      </div>

      {/* Max Trades */}
      <div>
        <label className="block text-sm text-muted mb-1">Max Trades for Today</label>
        <input
          type="number"
          value={form.max_trades}
          onChange={(e) => update('max_trades', e.target.value)}
          min={1}
          max={10}
          className="w-24 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm text-muted mb-1">Session Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
          rows={3}
          placeholder="Key observations, reminders, or market context..."
        />
      </div>

      {saved && (
        <div className="text-sm text-green bg-green/10 rounded-lg px-3 py-2">
          Session plan saved.
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-accent text-background font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Session Plan'}
      </button>
    </form>
  );
}
