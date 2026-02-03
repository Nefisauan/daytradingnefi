'use client';

import { useState, useEffect } from 'react';
import { EconomicEvent } from '@/lib/types';
import { format } from 'date-fns';

// Static known high-impact events for Gold
const RECURRING_EVENTS: Omit<EconomicEvent, 'id' | 'actual'>[] = [
  { time: '08:30', currency: 'USD', event: 'Non-Farm Payrolls (NFP)', impact: 'high', forecast: '', previous: '' },
  { time: '08:30', currency: 'USD', event: 'CPI (Consumer Price Index)', impact: 'high', forecast: '', previous: '' },
  { time: '08:30', currency: 'USD', event: 'PPI (Producer Price Index)', impact: 'medium', forecast: '', previous: '' },
  { time: '08:30', currency: 'USD', event: 'Initial Jobless Claims', impact: 'medium', forecast: '', previous: '' },
  { time: '10:00', currency: 'USD', event: 'ISM Manufacturing PMI', impact: 'high', forecast: '', previous: '' },
  { time: '10:00', currency: 'USD', event: 'ISM Services PMI', impact: 'medium', forecast: '', previous: '' },
  { time: '14:00', currency: 'USD', event: 'FOMC Rate Decision', impact: 'high', forecast: '', previous: '' },
  { time: '14:30', currency: 'USD', event: 'FOMC Press Conference', impact: 'high', forecast: '', previous: '' },
  { time: '08:30', currency: 'USD', event: 'GDP (Gross Domestic Product)', impact: 'high', forecast: '', previous: '' },
  { time: '08:30', currency: 'USD', event: 'Core PCE Price Index', impact: 'high', forecast: '', previous: '' },
  { time: '10:00', currency: 'USD', event: 'Consumer Confidence', impact: 'medium', forecast: '', previous: '' },
  { time: '10:00', currency: 'USD', event: 'New Home Sales', impact: 'low', forecast: '', previous: '' },
  { time: '08:30', currency: 'USD', event: 'Retail Sales', impact: 'high', forecast: '', previous: '' },
  { time: '09:15', currency: 'USD', event: 'Industrial Production', impact: 'medium', forecast: '', previous: '' },
  { time: '10:30', currency: 'USD', event: 'Crude Oil Inventories', impact: 'medium', forecast: '', previous: '' },
];

const IMPACT_COLORS: Record<string, string> = {
  high: 'bg-red/15 text-red border-red/30',
  medium: 'bg-amber-400/15 text-amber-400 border-amber-400/30',
  low: 'bg-muted/15 text-muted border-muted/30',
};

const IMPACT_DOT: Record<string, string> = {
  high: 'bg-red',
  medium: 'bg-amber-400',
  low: 'bg-muted',
};

interface Props {
  onAIAnalysis?: (events: EconomicEvent[]) => void;
}

export default function EconomicCalendar({ onAIAnalysis }: Props) {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    // Generate today's events from recurring list (static dataset)
    const todayEvents: EconomicEvent[] = RECURRING_EVENTS.map((e, i) => ({
      ...e,
      id: `event-${i}`,
      actual: undefined,
    }));
    setEvents(todayEvents);
  }, []);

  const filtered = events.filter((e) => {
    if (filter === 'all') return true;
    return e.impact === filter;
  });

  const highImpactCount = events.filter((e) => e.impact === 'high').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Economic Calendar</h3>
          <p className="text-sm text-muted">{format(new Date(), 'EEEE, MMMM d, yyyy')} (ET)</p>
        </div>
        {onAIAnalysis && (
          <button
            onClick={() => onAIAnalysis(events)}
            className="text-xs px-3 py-1.5 rounded-lg border border-accent/30 text-accent hover:bg-accent/10 transition-colors"
          >
            AI Analysis
          </button>
        )}
      </div>

      {highImpactCount > 0 && (
        <div className="bg-red/5 border border-red/20 rounded-xl px-4 py-3 text-sm">
          <span className="font-medium text-red">{highImpactCount} high-impact event{highImpactCount > 1 ? 's' : ''} today.</span>
          <span className="text-muted ml-1">Consider reducing position size or avoiding trades near these times.</span>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'high', 'medium', 'low'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors capitalize ${
              filter === f ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:text-foreground'
            }`}
          >
            {f === 'all' ? 'All Events' : f + ' Impact'}
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted text-sm">No events match the filter.</div>
        ) : (
          filtered.map((event) => (
            <div
              key={event.id}
              className="bg-card border border-border rounded-xl p-4 flex items-start gap-3"
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${IMPACT_DOT[event.impact]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm text-muted">{event.time}</span>
                  <span className="text-xs text-muted">{event.currency}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${IMPACT_COLORS[event.impact]}`}>
                    {event.impact}
                  </span>
                </div>
                <div className="text-sm font-medium">{event.event}</div>
                {(event.forecast || event.previous) && (
                  <div className="flex gap-4 mt-1 text-xs text-muted">
                    {event.forecast && <span>Forecast: {event.forecast}</span>}
                    {event.previous && <span>Previous: {event.previous}</span>}
                    {event.actual && <span className="text-foreground font-medium">Actual: {event.actual}</span>}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* No-trade zone guide */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h4 className="text-sm font-medium mb-2">No-Trade Zone Guide</h4>
        <ul className="text-xs text-muted space-y-1">
          <li>&#8226; Avoid trading 15 min before and after high-impact events</li>
          <li>&#8226; FOMC days: reduced size or no trading after 2:00 PM ET</li>
          <li>&#8226; NFP / CPI: extreme volatility expected at 8:30 AM ET</li>
          <li>&#8226; Gold is highly sensitive to USD data and Fed commentary</li>
        </ul>
      </div>
    </div>
  );
}
