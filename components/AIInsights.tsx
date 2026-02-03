'use client';

import { useState } from 'react';
import { Trade } from '@/lib/types';

interface Props {
  trades: Trade[];
}

export default function AIInsights({ trades }: Props) {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzePatterns = async () => {
    if (trades.length < 3) {
      setError('Log at least 3 trades to get AI insights.');
      return;
    }

    setLoading(true);
    setError('');
    setInsight('');

    try {
      const res = await fetch('/api/analyze-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trades: trades.slice(0, 50) }),
      });

      if (!res.ok) throw new Error('Failed to analyze');

      const data = await res.json();
      setInsight(data.insight || 'No insights generated.');
    } catch {
      setError('Failed to get AI insights. Make sure ANTHROPIC_API_KEY is set.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">AI Trading Coach</h3>
          <p className="text-sm text-muted">Claude analyzes your trading patterns</p>
        </div>
        <button
          onClick={analyzePatterns}
          disabled={loading}
          className="text-sm px-4 py-2 rounded-lg bg-accent text-background font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Get Insights'}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red bg-red/10 rounded-lg px-3 py-2">{error}</div>
      )}

      {insight && (
        <div className="bg-background border border-border rounded-xl p-4">
          <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">
            {insight}
          </div>
        </div>
      )}

      {!insight && !error && !loading && (
        <div className="text-sm text-muted">
          Click &ldquo;Get Insights&rdquo; to have Claude analyze your recent trades and provide coaching feedback.
        </div>
      )}
    </div>
  );
}
