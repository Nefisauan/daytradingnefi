'use client';

import { useState } from 'react';
import { Trade, ReflectionFormData, EmotionLevel } from '@/lib/types';
import EmotionTracker from './EmotionTracker';

interface Props {
  trades: Trade[];
  onSubmit: (form: ReflectionFormData) => Promise<void>;
}

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
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (key: keyof ReflectionFormData, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(form);
    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
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

      {/* Reflection questions */}
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
