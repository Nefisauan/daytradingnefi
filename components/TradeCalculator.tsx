'use client';

import { useState } from 'react';
import { MARKETS, MarketType } from '@/lib/types';

// Tick values per contract
const TICK_VALUES: Record<string, { tickSize: number; tickValue: number }> = {
  GC: { tickSize: 0.10, tickValue: 10.00 },     // Gold: $10 per tick ($0.10)
  MGC: { tickSize: 0.10, tickValue: 1.00 },      // Micro Gold: $1 per tick ($0.10)
  ES: { tickSize: 0.25, tickValue: 12.50 },      // S&P 500: $12.50 per tick ($0.25)
  MES: { tickSize: 0.25, tickValue: 1.25 },      // Micro S&P: $1.25 per tick ($0.25)
};

export default function TradeCalculator() {
  const [market, setMarket] = useState<MarketType>('GC');
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [entry, setEntry] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [contracts, setContracts] = useState('1');

  const spec = TICK_VALUES[market] || TICK_VALUES.GC;
  const entryNum = parseFloat(entry);
  const slNum = parseFloat(stopLoss);
  const tpNum = parseFloat(takeProfit);
  const contractsNum = parseInt(contracts) || 1;

  const hasEntry = !isNaN(entryNum);
  const hasSL = !isNaN(slNum);
  const hasTP = !isNaN(tpNum);

  // Calculate ticks from entry
  let slTicks = 0;
  let tpTicks = 0;
  let slDollars = 0;
  let tpDollars = 0;
  let rr = 0;

  if (hasEntry && hasSL) {
    if (direction === 'long') {
      slTicks = (entryNum - slNum) / spec.tickSize;
    } else {
      slTicks = (slNum - entryNum) / spec.tickSize;
    }
    slDollars = Math.abs(slTicks) * spec.tickValue * contractsNum;
  }

  if (hasEntry && hasTP) {
    if (direction === 'long') {
      tpTicks = (tpNum - entryNum) / spec.tickSize;
    } else {
      tpTicks = (entryNum - tpNum) / spec.tickSize;
    }
    tpDollars = Math.abs(tpTicks) * spec.tickValue * contractsNum;
  }

  if (slDollars > 0 && tpDollars > 0) {
    rr = tpDollars / slDollars;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Trade Calculator</h3>
      <p className="text-xs text-muted">Calculate potential profit/loss before entering a trade.</p>

      {/* Market & Direction */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">Market</label>
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          >
            {MARKETS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Direction</label>
          <div className="flex gap-2">
            {(['long', 'short'] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => setDirection(dir)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all capitalize ${
                  direction === dir
                    ? dir === 'long'
                      ? 'border-green/40 bg-green/10 text-green'
                      : 'border-red/40 bg-red/10 text-red'
                    : 'border-border bg-background text-muted hover:text-foreground'
                }`}
              >
                {dir}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">Entry Price</label>
          <input
            type="number"
            step="any"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent"
            placeholder={market === 'ES' || market === 'MES' ? '5950.00' : '2045.50'}
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Stop Loss</label>
          <input
            type="number"
            step="any"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent"
            placeholder={market === 'ES' || market === 'MES' ? '5945.00' : '2043.00'}
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Take Profit</label>
          <input
            type="number"
            step="any"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent"
            placeholder={market === 'ES' || market === 'MES' ? '5960.00' : '2052.00'}
          />
        </div>
      </div>

      {/* Contracts */}
      <div>
        <label className="block text-xs text-muted mb-1">Contracts / Lots</label>
        <input
          type="number"
          min="1"
          value={contracts}
          onChange={(e) => setContracts(e.target.value)}
          className="w-24 bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent"
        />
      </div>

      {/* Tick info */}
      <div className="text-[11px] text-muted bg-card border border-border rounded-lg px-3 py-2">
        {market}: Tick size = ${spec.tickSize.toFixed(2)} | Tick value = ${spec.tickValue.toFixed(2)} per contract
      </div>

      {/* Results */}
      {hasEntry && (hasSL || hasTP) && (
        <div className="grid grid-cols-2 gap-3">
          {hasSL && (
            <div className="bg-card border border-red/20 rounded-xl p-4">
              <div className="text-xs text-muted mb-1">Risk (Loss)</div>
              <div className="text-xl font-bold font-mono text-red">
                -${slDollars.toFixed(2)}
              </div>
              <div className="text-[11px] text-muted mt-1">
                {Math.abs(slTicks).toFixed(0)} ticks | {contractsNum} contract{contractsNum !== 1 ? 's' : ''}
              </div>
              <div className="text-[11px] text-muted">
                ${(slDollars / contractsNum).toFixed(2)} per contract
              </div>
            </div>
          )}
          {hasTP && (
            <div className="bg-card border border-green/20 rounded-xl p-4">
              <div className="text-xs text-muted mb-1">Reward (Profit)</div>
              <div className="text-xl font-bold font-mono text-green">
                +${tpDollars.toFixed(2)}
              </div>
              <div className="text-[11px] text-muted mt-1">
                {Math.abs(tpTicks).toFixed(0)} ticks | {contractsNum} contract{contractsNum !== 1 ? 's' : ''}
              </div>
              <div className="text-[11px] text-muted">
                ${(tpDollars / contractsNum).toFixed(2)} per contract
              </div>
            </div>
          )}
        </div>
      )}

      {/* R:R ratio */}
      {rr > 0 && (
        <div className={`bg-card border rounded-xl p-4 text-center ${
          rr >= 2 ? 'border-green/30' : rr >= 1 ? 'border-amber-400/30' : 'border-red/30'
        }`}>
          <div className="text-xs text-muted mb-1">Risk : Reward Ratio</div>
          <div className={`text-2xl font-bold font-mono ${
            rr >= 2 ? 'text-green' : rr >= 1 ? 'text-amber-400' : 'text-red'
          }`}>
            1 : {rr.toFixed(2)}
          </div>
          <div className="text-[11px] text-muted mt-1">
            {rr >= 2 ? 'Good R:R — trade aligns with edge' : rr >= 1 ? 'Acceptable — consider if setup is A+' : 'Poor R:R — reconsider this trade'}
          </div>
        </div>
      )}
    </div>
  );
}
