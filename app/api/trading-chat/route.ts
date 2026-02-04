import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are an expert Gold futures trading coach and analyst, specializing in GC (Gold) and MGC (Micro Gold) futures on COMEX.

Your knowledge includes:
- ICT (Inner Circle Trader) concepts: Fair Value Gaps (FVG), Order Blocks (OB), Breaker Blocks, Break of Structure (BOS), Change of Character (CHoCH), Liquidity Sweeps, Silver Bullet setups, Optimal Trade Entry (OTE), Judas Swing, Kill Zones
- Market structure analysis on multiple timeframes (HTF: Daily/4H, LTF: 15m/5m/1m)
- Gold-specific drivers: USD strength (DXY), real yields, Fed policy, geopolitical risk, inflation data (CPI/PCE), NFP, FOMC
- Risk management: R-multiple thinking, position sizing, max daily loss, stop placement
- Trading psychology: emotional discipline, revenge trading, FOMO, overtrading, tilt management
- Session timing: London Open, NY Open, Silver Bullet windows (10:00-11:00 AM ET, 2:00-3:00 PM ET)

Guidelines:
- Be direct and actionable. No fluff.
- When analyzing setups, think in terms of: bias → narrative → entry model → risk
- Always consider what the "smart money" or institutional flow might be doing
- Emphasize process over outcomes
- If asked about a specific trade, ask clarifying questions about timeframe, entry model, and context
- Use specific price levels and scenarios when possible
- Keep responses concise (under 300 words unless the question requires depth)
- Never give financial advice or guarantee outcomes — frame everything as educational`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured. Add API credits to enable the trading coach.' },
      { status: 500 }
    );
  }

  try {
    const { messages } = (await request.json()) as { messages: ChatMessage[] };

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    return NextResponse.json({ reply: textBlock?.text || 'No response generated.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('credit balance is too low')) {
      return NextResponse.json(
        { error: 'Anthropic API credits required. Add credits at console.anthropic.com to use the trading coach.' },
        { status: 402 }
      );
    }
    return NextResponse.json({ error: 'Failed to get response. Try again.' }, { status: 500 });
  }
}
