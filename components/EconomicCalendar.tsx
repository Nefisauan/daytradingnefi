'use client';

import { useState, useEffect, useCallback } from 'react';
import { EconomicEvent } from '@/lib/types';
import { format } from 'date-fns';

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

export default function EconomicCalendar() {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanation, setLoadingExplanation] = useState<Record<string, boolean>>({});
  const [marketBrief, setMarketBrief] = useState('');
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [source, setSource] = useState<'ai' | 'static' | ''>('');

  // Fetch events from AI-powered API
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/economic-calendar');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        const evts: EconomicEvent[] = (data.events || []).map((e: Omit<EconomicEvent, 'id'>, i: number) => ({
          ...e,
          id: `event-${i}`,
        }));
        setEvents(evts);
        setSource(data.source || 'ai');
      } catch {
        setError('Could not load economic calendar.');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Explain a single event's impact on Gold
  const explainEvent = useCallback(async (event: EconomicEvent) => {
    if (explanations[event.id]) return; // already loaded
    setLoadingExplanation((prev) => ({ ...prev, [event.id]: true }));
    try {
      const res = await fetch('/api/economic-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, type: 'explain' }),
      });
      const data = await res.json();
      setExplanations((prev) => ({ ...prev, [event.id]: data.explanation }));
    } catch {
      setExplanations((prev) => ({ ...prev, [event.id]: 'Failed to get explanation.' }));
    } finally {
      setLoadingExplanation((prev) => ({ ...prev, [event.id]: false }));
    }
  }, [explanations]);

  // Get overall market brief
  const getMarketBrief = async () => {
    if (events.length === 0) return;
    setLoadingBrief(true);
    try {
      const res = await fetch('/api/economic-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: events, type: 'brief' }),
      });
      const data = await res.json();
      setMarketBrief(data.explanation);
    } catch {
      setMarketBrief('Failed to generate market brief.');
    } finally {
      setLoadingBrief(false);
    }
  };

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
        {source === 'ai' && (
          <button
            onClick={getMarketBrief}
            disabled={loadingBrief || events.length === 0}
            className="text-xs px-3 py-1.5 rounded-lg border border-accent/30 text-accent hover:bg-accent/10 transition-colors disabled:opacity-50"
          >
            {loadingBrief ? 'Analyzing...' : 'AI Market Brief'}
          </button>
        )}
      </div>

      {source === 'static' && !loading && (
        <div className="text-xs text-muted bg-card border border-border rounded-lg px-3 py-2">
          Showing estimated recurring events. Add Anthropic API credits for real-time AI-powered calendar with exact times and forecasts.
        </div>
      )}

      {/* Market brief */}
      {marketBrief && (
        <div className="bg-accent/5 border border-accent/20 rounded-xl px-4 py-3">
          <h4 className="text-sm font-medium text-accent mb-2">Gold Market Brief</h4>
          <div className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{marketBrief}</div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted">Loading today&apos;s events...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm text-red bg-red/10 rounded-lg px-3 py-2">{error}</div>
      )}

      {!loading && (
        <>
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
            {events.length === 0 && !error ? (
              <div className="text-center py-8 text-muted text-sm">No economic events scheduled for today.</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-muted text-sm">No events match the filter.</div>
            ) : (
              filtered.map((event) => (
                <div key={event.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start gap-3">
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

                      {/* Explain Impact button — only with AI source */}
                      {source === 'ai' && (
                        <div className="mt-2">
                          {explanations[event.id] ? (
                            <div className="text-xs text-foreground/70 bg-background rounded-lg px-3 py-2 leading-relaxed">
                              {explanations[event.id]}
                            </div>
                          ) : (
                            <button
                              onClick={() => explainEvent(event)}
                              disabled={loadingExplanation[event.id]}
                              className="text-[11px] text-accent hover:underline disabled:opacity-50"
                            >
                              {loadingExplanation[event.id] ? 'Analyzing...' : 'Explain Gold Impact'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
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
        </>
      )}
    </div>
  );
}
