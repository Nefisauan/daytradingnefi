'use client';

import { EmotionLevel } from '@/lib/types';

interface Props {
  label: string;
  value: EmotionLevel | '';
  onChange: (val: EmotionLevel) => void;
}

const EMOTIONS: { value: EmotionLevel; emoji: string; label: string; color: string }[] = [
  { value: 'calm', emoji: '\u{1F600}', label: 'Calm', color: 'border-green/40 bg-green/10 text-green' },
  { value: 'focused', emoji: '\u{1F3AF}', label: 'Focused', color: 'border-blue-400/40 bg-blue-400/10 text-blue-400' },
  { value: 'anxious', emoji: '\u{1F630}', label: 'Anxious', color: 'border-amber-400/40 bg-amber-400/10 text-amber-400' },
  { value: 'frustrated', emoji: '\u{1F621}', label: 'Frustrated', color: 'border-orange-400/40 bg-orange-400/10 text-orange-400' },
  { value: 'tilted', emoji: '\u{1F525}', label: 'Tilted', color: 'border-red/40 bg-red/10 text-red' },
];

export default function EmotionTracker({ label, value, onChange }: Props) {
  return (
    <div>
      <label className="block text-sm text-muted mb-2">{label}</label>
      <div className="flex gap-2">
        {EMOTIONS.map((e) => (
          <button
            key={e.value}
            onClick={() => onChange(e.value)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all text-center ${
              value === e.value ? e.color : 'border-border bg-card hover:border-border/80'
            }`}
          >
            <span className="text-xl">{e.emoji}</span>
            <span className="text-[10px] font-medium">{e.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
