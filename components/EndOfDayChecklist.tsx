'use client';

import { useState } from 'react';

interface Props {
  planId: string | null;
  initialValues?: {
    eod_journal_done?: boolean;
    eod_replay_done?: boolean;
    eod_playbook_done?: boolean;
    eod_session_rating?: number | null;
  };
  onSubmit: (planId: string, updates: {
    eod_journal_done: boolean;
    eod_replay_done: boolean;
    eod_playbook_done: boolean;
    eod_session_rating: number;
  }) => Promise<void>;
}

const ITEMS = [
  { key: 'eod_journal_done' as const, label: 'Journal entries completed', desc: 'All trades reflected on' },
  { key: 'eod_replay_done' as const, label: 'Session replay done', desc: 'Reviewed charts and executions' },
  { key: 'eod_playbook_done' as const, label: 'Playbook updated', desc: 'New rules or insights added' },
];

export default function EndOfDayChecklist({ planId, initialValues, onSubmit }: Props) {
  const [checks, setChecks] = useState({
    eod_journal_done: initialValues?.eod_journal_done ?? false,
    eod_replay_done: initialValues?.eod_replay_done ?? false,
    eod_playbook_done: initialValues?.eod_playbook_done ?? false,
  });
  const [rating, setRating] = useState(initialValues?.eod_session_rating ?? 0);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof typeof checks) => {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    if (!planId) return;
    setLoading(true);
    await onSubmit(planId, { ...checks, eod_session_rating: rating });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!planId) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 text-center text-muted">
        <p>Create a session plan first to use the end-of-day checklist.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-lg">End of Day Review</h3>

      <div className="space-y-2">
        {ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => toggle(item.key)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
              checks[item.key]
                ? 'border-green/30 bg-green/5'
                : 'border-border bg-background'
            }`}
          >
            <div
              className={`w-5 h-5 rounded flex items-center justify-center text-xs ${
                checks[item.key] ? 'bg-green/20 text-green' : 'bg-border text-muted'
              }`}
            >
              {checks[item.key] ? '\u2713' : ''}
            </div>
            <div>
              <div className="text-sm font-medium">{item.label}</div>
              <div className="text-xs text-muted">{item.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Session Rating */}
      <div>
        <label className="block text-sm text-muted mb-2">Session Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              className={`w-10 h-10 rounded-xl border text-sm font-bold transition-all ${
                rating >= n
                  ? 'border-accent bg-accent/15 text-accent'
                  : 'border-border bg-background text-muted'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {saved && (
        <div className="text-sm text-green bg-green/10 rounded-lg px-3 py-2">
          End of day review saved.
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-accent text-background font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Review'}
      </button>
    </div>
  );
}
