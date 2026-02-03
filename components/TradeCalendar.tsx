'use client';

import { useState, useMemo, useCallback } from 'react';
import { Trade, Reflection, EmotionLevel } from '@/lib/types';
import { loadTradeScreenshots } from '@/lib/supabase/database';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  addMonths,
  subMonths,
} from 'date-fns';

interface Props {
  trades: Trade[];
  reflections: Reflection[];
  supabase: any;
  userId: string;
  onTradeClick?: (trade: Trade) => void;
}

const EMOTION_EMOJIS: Record<EmotionLevel, string> = {
  calm: '\u{1F600}',
  focused: '\u{1F3AF}',
  anxious: '\u{1F630}',
  frustrated: '\u{1F621}',
  tilted: '\u{1F525}',
};

const GRADE_COLORS: Record<string, string> = {
  A: 'text-green bg-green/10',
  B: 'text-blue-400 bg-blue-400/10',
  C: 'text-amber-400 bg-amber-400/10',
  F: 'text-red bg-red/10',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getTradeDate(trade: Trade): string {
  const dateStr = trade.entry_time || trade.created_at;
  return format(new Date(dateStr), 'yyyy-MM-dd');
}

export default function TradeCalendar({
  trades,
  reflections,
  supabase,
  userId,
  onTradeClick,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<
    Record<string, { url: string; label: string | null }[]>
  >({});
  const [loadingScreenshots, setLoadingScreenshots] = useState<Record<string, boolean>>({});

  // Group trades by date
  const tradesByDate = useMemo(() => {
    const map: Record<string, Trade[]> = {};
    for (const trade of trades) {
      const dateKey = getTradeDate(trade);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(trade);
    }
    return map;
  }, [trades]);

  // Group reflections by trade_id for quick lookup
  const reflectionsByTradeId = useMemo(() => {
    const map: Record<string, Reflection[]> = {};
    for (const r of reflections) {
      if (r.trade_id) {
        if (!map[r.trade_id]) map[r.trade_id] = [];
        map[r.trade_id].push(r);
      }
    }
    return map;
  }, [reflections]);

  // Build grid days
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  // Monthly summary
  const monthSummary = useMemo(() => {
    const monthStr = format(currentMonth, 'yyyy-MM');
    let count = 0;
    let pnl = 0;
    for (const [dateKey, dateTrades] of Object.entries(tradesByDate)) {
      if (dateKey.startsWith(monthStr)) {
        count += dateTrades.length;
        pnl += dateTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      }
    }
    return { count, pnl };
  }, [tradesByDate, currentMonth]);

  // Load screenshots for a trade (with caching)
  const fetchScreenshots = useCallback(
    async (tradeId: string) => {
      if (screenshots[tradeId] || loadingScreenshots[tradeId]) return;

      setLoadingScreenshots((prev) => ({ ...prev, [tradeId]: true }));
      try {
        const results = await loadTradeScreenshots(supabase, tradeId);
        setScreenshots((prev) => ({
          ...prev,
          [tradeId]: results.map((r) => ({ url: r.url, label: r.label })),
        }));
      } catch {
        setScreenshots((prev) => ({ ...prev, [tradeId]: [] }));
      } finally {
        setLoadingScreenshots((prev) => ({ ...prev, [tradeId]: false }));
      }
    },
    [supabase, screenshots, loadingScreenshots]
  );

  // Handle day click
  const handleDayClick = useCallback(
    (dateKey: string) => {
      if (!tradesByDate[dateKey]) return;

      if (selectedDate === dateKey) {
        setSelectedDate(null);
        return;
      }

      setSelectedDate(dateKey);

      // Load screenshots for all trades on that day
      const dayTrades = tradesByDate[dateKey] || [];
      for (const trade of dayTrades) {
        fetchScreenshots(trade.id);
      }
    },
    [tradesByDate, selectedDate, fetchScreenshots]
  );

  const today = format(new Date(), 'yyyy-MM-dd');

  // Trades for the selected (expanded) day
  const selectedDayTrades = selectedDate ? tradesByDate[selectedDate] || [] : [];

  return (
    <div className="space-y-4">
      {/* Month navigation header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="border border-border rounded-lg px-3 py-1.5 text-muted hover:text-foreground hover:border-accent/40 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="inline">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="text-center">
          <h3 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h3>
          <p className="text-xs text-muted mt-0.5">
            {monthSummary.count} trade{monthSummary.count !== 1 ? 's' : ''} |{' '}
            <span className={monthSummary.pnl >= 0 ? 'text-green' : 'text-red'}>
              {monthSummary.pnl >= 0 ? '+' : ''}
              ${monthSummary.pnl.toFixed(2)} P&L
            </span>
          </p>
        </div>

        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="border border-border rounded-lg px-3 py-1.5 text-muted hover:text-foreground hover:border-accent/40 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="inline">
            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Day-of-week header row */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_NAMES.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, currentMonth);
          const isToday = dateKey === today;
          const isSelected = dateKey === selectedDate;
          const dayTrades = tradesByDate[dateKey] || [];
          const hasTrades = dayTrades.length > 0;
          const dayPnl = dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

          return (
            <button
              key={dateKey}
              onClick={() => handleDayClick(dateKey)}
              disabled={!hasTrades}
              className={`
                min-h-[52px] sm:min-h-[80px] rounded-lg p-1 sm:p-2 text-left transition-all relative
                ${hasTrades ? 'cursor-pointer hover:border-accent/40' : 'cursor-default'}
                ${isSelected
                  ? 'bg-card border-2 border-accent'
                  : isToday
                  ? 'bg-card border border-accent/50'
                  : 'bg-card border border-border'
                }
                ${!inMonth ? 'opacity-40' : ''}
              `}
            >
              {/* Day number */}
              <div
                className={`text-xs font-medium ${
                  isToday
                    ? 'text-accent font-bold'
                    : inMonth
                    ? 'text-foreground'
                    : 'text-muted'
                }`}
              >
                {format(day, 'd')}
              </div>

              {/* Trade dots */}
              {hasTrades && (
                <div className="flex items-center gap-0.5 mt-1 flex-wrap">
                  {dayTrades.map((trade) => (
                    <span
                      key={trade.id}
                      className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                        trade.outcome === 'win'
                          ? 'bg-green'
                          : trade.outcome === 'loss'
                          ? 'bg-red'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* P&L for day */}
              {hasTrades && (
                <div
                  className={`text-[10px] sm:text-xs font-mono mt-0.5 ${
                    dayPnl > 0 ? 'text-green' : dayPnl < 0 ? 'text-red' : 'text-muted'
                  }`}
                >
                  {dayPnl >= 0 ? '+' : ''}
                  {dayPnl.toFixed(0)}
                </div>
              )}

              {/* Trade count badge */}
              {dayTrades.length > 1 && (
                <div className="absolute top-1 right-1 text-[9px] sm:text-[10px] bg-border text-muted rounded-full w-4 h-4 flex items-center justify-center font-medium">
                  {dayTrades.length}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Expandable day detail */}
      {selectedDate && selectedDayTrades.length > 0 && (
        <div className="bg-card border border-accent/30 rounded-xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">
              {format(new Date(selectedDate + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}
            </h4>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-muted hover:text-foreground text-xs border border-border rounded-lg px-2 py-1 transition-colors"
            >
              Close
            </button>
          </div>

          {selectedDayTrades.map((trade) => {
            const isWin = trade.outcome === 'win';
            const isLoss = trade.outcome === 'loss';
            const pnlColor = isWin ? 'text-green' : isLoss ? 'text-red' : 'text-muted';
            const dirColor = trade.direction === 'long' ? 'text-green' : 'text-red';
            const tradeReflections = reflectionsByTradeId[trade.id] || [];
            const tradeScreenshots = screenshots[trade.id] || [];
            const isLoadingScreenshots = loadingScreenshots[trade.id] || false;

            return (
              <div
                key={trade.id}
                className="border border-border rounded-lg p-3 space-y-3"
              >
                {/* Trade header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-0.5 rounded">
                      {trade.market}
                    </span>
                    <span className={`text-xs font-semibold uppercase ${dirColor}`}>
                      {trade.direction}
                    </span>
                    <span className="text-xs text-muted bg-background px-2 py-0.5 rounded">
                      {trade.setup_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {trade.execution_grade && (
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          GRADE_COLORS[trade.execution_grade] || 'text-muted'
                        }`}
                      >
                        {trade.execution_grade}
                      </span>
                    )}
                    {trade.outcome && (
                      <span className={`text-xs font-semibold uppercase ${pnlColor}`}>
                        {trade.outcome === 'breakeven' ? 'BE' : trade.outcome}
                      </span>
                    )}
                  </div>
                </div>

                {/* Trade details */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <div className="text-muted mb-0.5">P&L</div>
                    <div className={`font-mono font-semibold ${pnlColor}`}>
                      {trade.pnl != null
                        ? (trade.pnl >= 0 ? '+' : '') + trade.pnl.toFixed(2)
                        : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted mb-0.5">Entry</div>
                    <div className="font-mono">{trade.entry_price ?? '-'}</div>
                  </div>
                  <div>
                    <div className="text-muted mb-0.5">Exit</div>
                    <div className="font-mono">{trade.exit_price ?? '-'}</div>
                  </div>
                  {trade.r_multiple != null && (
                    <div>
                      <div className="text-muted mb-0.5">R</div>
                      <div className={`font-mono ${pnlColor}`}>
                        {(trade.r_multiple >= 0 ? '+' : '') + trade.r_multiple.toFixed(1)}R
                      </div>
                    </div>
                  )}
                </div>

                {/* Time */}
                {trade.entry_time && (
                  <div className="text-[11px] text-muted">
                    {format(new Date(trade.entry_time), 'h:mm a')}
                    {trade.exit_time &&
                      ` \u2014 ${format(new Date(trade.exit_time), 'h:mm a')}`}
                  </div>
                )}

                {/* Notes */}
                {trade.notes && (
                  <p className="text-xs text-muted/80 italic">{trade.notes}</p>
                )}

                {/* Screenshots */}
                {isLoadingScreenshots && (
                  <div className="text-xs text-muted animate-pulse">
                    Loading screenshots...
                  </div>
                )}
                {tradeScreenshots.length > 0 && (
                  <div className="overflow-x-auto">
                    <div className="flex gap-2 pb-1">
                      {tradeScreenshots.map((ss, idx) => (
                        <a
                          key={idx}
                          href={ss.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 group"
                        >
                          <img
                            src={ss.url}
                            alt={ss.label || `Screenshot ${idx + 1}`}
                            className="h-16 sm:h-20 w-auto rounded border border-border group-hover:border-accent/50 transition-colors object-cover"
                          />
                          {ss.label && (
                            <div className="text-[9px] text-muted mt-0.5 text-center truncate max-w-[80px]">
                              {ss.label}
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reflections */}
                {tradeReflections.length > 0 && (
                  <div className="border-t border-border pt-2 space-y-2">
                    {tradeReflections.map((ref) => (
                      <div key={ref.id} className="space-y-1">
                        {/* Emotion emojis */}
                        <div className="flex items-center gap-2 text-xs">
                          {ref.pre_emotion && (
                            <span title={`Pre: ${ref.pre_emotion}`}>
                              {EMOTION_EMOJIS[ref.pre_emotion]} Pre
                            </span>
                          )}
                          {ref.during_emotion && (
                            <span title={`During: ${ref.during_emotion}`}>
                              {EMOTION_EMOJIS[ref.during_emotion]} During
                            </span>
                          )}
                          {ref.post_emotion && (
                            <span title={`Post: ${ref.post_emotion}`}>
                              {EMOTION_EMOJIS[ref.post_emotion]} Post
                            </span>
                          )}
                        </div>

                        {/* Reflection texts */}
                        {ref.what_confirmed && (
                          <p className="text-[11px] text-muted">
                            <span className="text-green font-medium">Confirmed:</span>{' '}
                            {ref.what_confirmed}
                          </p>
                        )}
                        {ref.what_tempted && (
                          <p className="text-[11px] text-muted">
                            <span className="text-red font-medium">Tempted:</span>{' '}
                            {ref.what_tempted}
                          </p>
                        )}
                        {ref.what_improve && (
                          <p className="text-[11px] text-muted">
                            <span className="text-accent font-medium">Improve:</span>{' '}
                            {ref.what_improve}
                          </p>
                        )}
                        {ref.notes && (
                          <p className="text-[11px] text-muted italic">{ref.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Click to edit */}
                {onTradeClick && (
                  <button
                    onClick={() => onTradeClick(trade)}
                    className="text-[10px] text-accent/60 hover:text-accent transition-colors"
                  >
                    Tap to edit trade
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
