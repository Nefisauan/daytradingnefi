'use client';

import { useState } from 'react';
import { RuleCheckFormData } from '@/lib/types';

interface Props {
  tradeId: string;
  onSubmit: (tradeId: string, form: RuleCheckFormData) => Promise<void>;
  onClose: () => void;
}

const RULES = [
  { key: 'followed_rules' as const, label: 'Followed trading rules', desc: 'Stuck to your playbook and plan' },
  { key: 'waited_confirmation' as const, label: 'Waited for confirmation', desc: 'Didn\'t jump in early or chase' },
  { key: 'emotion_in_check' as const, label: 'Emotions in check', desc: 'Traded with a clear mind' },
  { key: 'valid_setup' as const, label: 'Valid setup', desc: 'The setup met all criteria' },
];

export default function RuleChecklist({ tradeId, onSubmit, onClose }: Props) {
  const [form, setForm] = useState<RuleCheckFormData>({
    followed_rules: true,
    waited_confirmation: true,
    emotion_in_check: true,
    valid_setup: true,
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const toggle = (key: keyof Omit<RuleCheckFormData, 'notes'>) => {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allPassed = form.followed_rules && form.waited_confirmation && form.emotion_in_check && form.valid_setup;

  const handleSubmit = async () => {
    setLoading(true);
    await onSubmit(tradeId, form);
    setLoading(false);
    onClose();
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Rule Checklist</h3>
        <button onClick={onClose} className="text-muted hover:text-foreground text-sm">
          Skip
        </button>
      </div>

      <p className="text-sm text-muted">How well did you execute this trade?</p>

      <div className="space-y-3">
        {RULES.map((rule) => {
          const checked = form[rule.key] as boolean;
          return (
            <button
              key={rule.key}
              onClick={() => toggle(rule.key)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                checked
                  ? 'border-green/30 bg-green/5'
                  : 'border-red/30 bg-red/5'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                  checked ? 'bg-green/20 text-green' : 'bg-red/20 text-red'
                }`}
              >
                {checked ? '\u2713' : '\u2717'}
              </div>
              <div>
                <div className="text-sm font-medium">{rule.label}</div>
                <div className="text-xs text-muted">{rule.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div>
        <label className="block text-sm text-muted mb-1">Notes (optional)</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors resize-none"
          rows={2}
          placeholder="Any execution notes..."
        />
      </div>

      <div className="flex items-center justify-between">
        <div className={`text-sm font-medium ${allPassed ? 'text-green' : 'text-red'}`}>
          {allPassed ? 'Clean execution' : 'Rules broken - review needed'}
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-5 py-2 rounded-lg bg-accent text-background font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
