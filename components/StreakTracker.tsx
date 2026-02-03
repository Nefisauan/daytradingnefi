'use client';

import { Streak } from '@/lib/types';

interface Props {
  streaks: Streak[];
}

const STREAK_META: Record<string, { label: string; icon: string }> = {
  trades_logged: { label: 'Trades Logged', icon: '\u{1F4CA}' },
  reflections: { label: 'Reflections', icon: '\u{1F4DD}' },
  session_plans: { label: 'Session Plans', icon: '\u{1F4CB}' },
  profitable_days: { label: 'Profitable Days', icon: '\u{1F4B0}' },
};

export default function StreakTracker({ streaks }: Props) {
  const defaultStreaks = ['trades_logged', 'reflections', 'session_plans', 'profitable_days'];

  const getStreak = (type: string): Streak | undefined => {
    return streaks.find((s) => s.streak_type === type);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {defaultStreaks.map((type) => {
        const streak = getStreak(type);
        const meta = STREAK_META[type] || { label: type, icon: '\u{1F525}' };
        const count = streak?.current_count || 0;
        const best = streak?.best_count || 0;
        const isActive = count > 0;

        return (
          <div
            key={type}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${
              isActive
                ? 'border-accent/30 bg-accent/5'
                : 'border-border bg-card'
            }`}
          >
            <span className="text-lg">{meta.icon}</span>
            <div>
              <div className={`font-bold font-mono ${isActive ? 'text-accent' : 'text-muted'}`}>
                {count}
              </div>
              <div className="text-[10px] text-muted">{meta.label}</div>
            </div>
            {best > 0 && (
              <div className="text-[10px] text-muted ml-1" title="Personal best">
                Best: {best}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
