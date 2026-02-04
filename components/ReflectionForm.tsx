'use client';

import { useState } from 'react';
import { Trade, ReflectionFormData, EmotionLevel } from '@/lib/types';
import EmotionTracker from './EmotionTracker';

interface Props {
  trades: Trade[];
  onSubmit: (form: ReflectionFormData) => Promise<void>;
}

const ENTRY_TIMING = ['Earlier', 'Same', 'Later'] as const;
const STOP_PLACEMENT = ['Tighter', 'Same', 'Wider'] as const;
const TARGET_SELECTION = ['Same', 'Better'] as const;
const POSITION_SIZING = ['Smaller', 'Same', 'Larger'] as const;
const MISSED_REASONS = ['Hesitation', 'Missed signal', 'Doubt', 'Distraction'] as const;

export default function ReflectionForm({ trades, onSubmit }: Props) {
  const [form, setForm] = useState<ReflectionFormData>({
    trade_id: '',
    pre_emotion: '',
    during_emotion: '',
    post_emotion: '',
    what_confirmed: '',
    what_tempted: '',
    what_improve: '',
    notes: '',
  });

  // New prompt fields (stored in notes)
  const [entryTiming, setEntryTiming] = useState('');
  const [stopPlacement, setStopPlacement] = useState('');
  const [targetSelection, setTargetSelection] = useState('');
  const [positionSizing, setPositionSizing] = useState('');
  const [nextFocus, setNextFocus] = useState('');
  const [wouldTakeAgain, setWouldTakeAgain] = useState('');
  const [priceAsExpected, setPriceAsExpected] = useState('');
  const [wrongAssumption, setWrongAssumption] = useState('');
  const [whatIgnored, setWhatIgnored] = useState('');
  const [missedSetup, setMissedSetup] = useState('');
  const [missedReason, setMissedReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (key: keyof ReflectionFormData, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Build structured notes from all extra fields
    const extraParts: string[] = [];
    if (entryTiming || stopPlacement || targetSelection || positionSizing) {
      extraParts.push(`[Flawless Version] Entry: ${entryTiming || '-'} | Stop: ${stopPlacement || '-'} | Target: ${targetSelection || '-'} | Size: ${positionSizing || '-'}`);
    }
    if (nextFocus) extraParts.push(`[Next Focus] ${nextFocus}`);
    if (wouldTakeAgain) extraParts.push(`[Would Take Again If Loss] ${wouldTakeAgain}`);
    if (priceAsExpected) extraParts.push(`[Price As Expected] ${priceAsExpected}`);
    if (wrongAssumption) extraParts.push(`[Wrong Assumption] ${wrongAssumption}`);
    if (whatIgnored) extraParts.push(`[What I Ignored] ${whatIgnored}`);
    if (missedSetup === 'yes' && missedReason) extraParts.push(`[Missed Setup] Reason: ${missedReason}`);

    const combinedNotes = [form.notes, ...extraParts].filter(Boolean).join('\n');

    await onSubmit({ ...form, notes: combinedNotes });
    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);

    // Reset everything
    setForm({
      trade_id: '',
      pre_emotion: '',
      during_emotion: '',
      post_emotion: '',
      what_confirmed: '',
      what_tempted: '',
      what_improve: '',
      notes: '',
    });
    setEntryTiming('');
    setStopPlacement('');
    setTargetSelection('');
    setPositionSizing('');
    setNextFocus('');
    setWouldTakeAgain('');
    setPriceAsExpected('');
    setWrongAssumption('');
    setWhatIgnored('');
    setMissedSetup('');
    setMissedReason('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h3 className="text-lg font-semibold">Trade Reflection</h3>

      {/* Link to trade */}
      {trades.length > 0 && (
        <div>
          <label className="block text-sm text-muted mb-1">Link to Trade (optional)</label>
          <select
            value={form.trade_id}
            onChange={(e) => update('trade_id', e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          >
            <option value="">None - General reflection</option>
            {trades.slice(0, 20).map((t) => (
              <option key={t.id} value={t.id}>
                {t.market} {t.direction.toUpperCase()} {t.setup_type} — {t.outcome || 'pending'}
                {t.pnl != null ? ` (${t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Emotion tracking */}
      <div className="space-y-4 bg-card border border-border rounded-xl p-4">
        <h4 className="font-medium text-sm">Emotional State</h4>
        <EmotionTracker
          label="Before the trade"
          value={form.pre_emotion}
          onChange={(v: EmotionLevel) => update('pre_emotion', v)}
        />
        <EmotionTracker
          label="During the trade"
          value={form.during_emotion}
          onChange={(v: EmotionLevel) => update('during_emotion', v)}
        />
        <EmotionTracker
          label="After the trade"
          value={form.post_emotion}
          onChange={(v: EmotionLevel) => update('post_emotion', v)}
        />
      </div>

      {/* ── Flawless Version Comparison ─────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h4 className="font-medium text-sm">If a flawless version of me traded this setup, what would be different?</h4>

        <div>
          <label className="block text-xs text-muted mb-1.5">Entry Timing</label>
          <div className="flex gap-2">
            {ENTRY_TIMING.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setEntryTiming(opt)}
                className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                  entryTiming === opt
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-background text-muted hover:text-foreground'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1.5">Stop Placement</label>
          <div className="flex gap-2">
            {STOP_PLACEMENT.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setStopPlacement(opt)}
                className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                  stopPlacement === opt
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-background text-muted hover:text-foreground'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1.5">Target Selection</label>
          <div className="flex gap-2">
            {TARGET_SELECTION.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setTargetSelection(opt)}
                className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                  targetSelection === opt
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-background text-muted hover:text-foreground'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1.5">Position Sizing</label>
          <div className="flex gap-2">
            {POSITION_SIZING.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setPositionSizing(opt)}
                className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                  positionSizing === opt
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-background text-muted hover:text-foreground'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Next Trade Focus ────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-4">
        <label className="block text-sm font-medium mb-2">
          &quot;On my next trade, I will focus on...&quot;
        </label>
        <input
          type="text"
          value={nextFocus}
          onChange={(e) => setNextFocus(e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          placeholder="e.g. Waiting for confirmation before entry"
        />
      </div>

      {/* ── Would Take Again ────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-4">
        <label className="block text-sm font-medium mb-2">
          If this trade had been a loss, would I still take it again?
        </label>
        <div className="flex gap-2">
          {['Yes', 'No'].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setWouldTakeAgain(opt)}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                wouldTakeAgain === opt
                  ? opt === 'Yes'
                    ? 'border-green/40 bg-green/10 text-green'
                    : 'border-red/40 bg-red/10 text-red'
                  : 'border-border bg-background text-muted hover:text-foreground'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* ── Post-Trade Comparison ───────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h4 className="font-medium text-sm">Post-Trade Comparison</h4>
        <div>
          <label className="block text-xs text-muted mb-1">Did price do what I expected?</label>
          <textarea
            value={priceAsExpected}
            onChange={(e) => setPriceAsExpected(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
            rows={2}
            placeholder="Yes/No — describe what happened vs expectation"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">What assumption was wrong?</label>
          <textarea
            value={wrongAssumption}
            onChange={(e) => setWrongAssumption(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
            rows={2}
            placeholder="e.g. I assumed the OB would hold but price swept through"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">What did I ignore?</label>
          <textarea
            value={whatIgnored}
            onChange={(e) => setWhatIgnored(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
            rows={2}
            placeholder="e.g. HTF was bearish but I took a long anyway"
          />
        </div>
      </div>

      {/* ── Missed Setup Tracking ──────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h4 className="font-medium text-sm">Did at least one valid setup occur that I didn&apos;t take?</h4>
        <div className="flex gap-2">
          {['yes', 'no'].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { setMissedSetup(opt); if (opt === 'no') setMissedReason(''); }}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium capitalize transition-all ${
                missedSetup === opt
                  ? opt === 'yes'
                    ? 'border-amber-400/40 bg-amber-400/10 text-amber-400'
                    : 'border-green/40 bg-green/10 text-green'
                  : 'border-border bg-background text-muted hover:text-foreground'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        {missedSetup === 'yes' && (
          <div>
            <label className="block text-xs text-muted mb-1.5">Why didn&apos;t I take it?</label>
            <div className="grid grid-cols-2 gap-2">
              {MISSED_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setMissedReason(reason)}
                  className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                    missedReason === reason
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-background text-muted hover:text-foreground'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Original Reflection Questions ──────────────────────────── */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-muted mb-1">What did this trade confirm about your edge?</label>
          <textarea
            value={form.what_confirmed}
            onChange={(e) => update('what_confirmed', e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
            rows={2}
            placeholder="My setup criteria were valid because..."
          />
        </div>
        <div>
          <label className="block text-sm text-muted mb-1">What tempted you to deviate from your plan?</label>
          <textarea
            value={form.what_tempted}
            onChange={(e) => update('what_tempted', e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
            rows={2}
            placeholder="I felt the urge to..."
          />
        </div>
        <div>
          <label className="block text-sm text-muted mb-1">What would you do differently next time?</label>
          <textarea
            value={form.what_improve}
            onChange={(e) => update('what_improve', e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
            rows={2}
            placeholder="Next time I would..."
          />
        </div>
        <div>
          <label className="block text-sm text-muted mb-1">Additional notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
            rows={2}
            placeholder="Anything else..."
          />
        </div>
      </div>

      {success && (
        <div className="text-sm text-green bg-green/10 rounded-lg px-3 py-2">
          Reflection saved successfully.
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-accent text-background font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Reflection'}
      </button>
    </form>
  );
}
