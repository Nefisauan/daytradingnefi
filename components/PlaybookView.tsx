'use client';

import { useState } from 'react';
import { PlaybookEntry, RuleType } from '@/lib/types';

interface Props {
  entries: PlaybookEntry[];
  onAdd: (entry: { rule_type: RuleType; title: string; description: string; setup_type: string }) => Promise<void>;
}

const RULE_TYPES: { value: RuleType; label: string; color: string }[] = [
  { value: 'trade', label: 'Trade Rule', color: 'border-green/30 bg-green/5 text-green' },
  { value: 'avoid', label: 'Avoid Rule', color: 'border-red/30 bg-red/5 text-red' },
  { value: 'execution', label: 'Execution', color: 'border-blue-400/30 bg-blue-400/5 text-blue-400' },
  { value: 'insight', label: 'Insight', color: 'border-accent/30 bg-accent/5 text-accent' },
];

export default function PlaybookView({ entries, onAdd }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [ruleType, setRuleType] = useState<RuleType>('trade');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [setupType, setSetupType] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setLoading(true);
    await onAdd({ rule_type: ruleType, title, description, setup_type: setupType });
    setLoading(false);
    setTitle('');
    setDescription('');
    setSetupType('');
    setShowForm(false);
  };

  const getTypeStyle = (type: RuleType) => {
    return RULE_TYPES.find((r) => r.value === type) || RULE_TYPES[0];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Playbook</h3>
          <p className="text-sm text-muted">{entries.length} active rule{entries.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm px-4 py-2 rounded-lg border border-accent/30 text-accent hover:bg-accent/10 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Rule'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex gap-2">
            {RULE_TYPES.map((rt) => (
              <button
                key={rt.value}
                onClick={() => setRuleType(rt.value)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  ruleType === rt.value ? rt.color : 'border-border text-muted'
                }`}
              >
                {rt.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Rule title..."
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description..."
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
            rows={2}
          />
          <input
            type="text"
            value={setupType}
            onChange={(e) => setSetupType(e.target.value)}
            placeholder="Related setup type (optional)"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
          <button
            onClick={handleAdd}
            disabled={loading || !title.trim()}
            className="px-5 py-2 rounded-lg bg-accent text-background font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add to Playbook'}
          </button>
        </div>
      )}

      {/* Entries */}
      {entries.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p className="text-lg mb-1">No playbook rules yet</p>
          <p className="text-sm">Add rules manually or let AI generate them from your trade patterns.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const style = getTypeStyle(entry.rule_type);
            return (
              <div key={entry.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${style.color}`}>
                    {style.label}
                  </span>
                  {entry.setup_type && (
                    <span className="text-xs text-muted bg-background px-2 py-0.5 rounded">
                      {entry.setup_type}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-medium">{entry.title}</h4>
                {entry.description && (
                  <p className="text-xs text-muted mt-1">{entry.description}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
