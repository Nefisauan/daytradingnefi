import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const { trades } = await request.json();
  if (!trades || !Array.isArray(trades) || trades.length === 0) {
    return NextResponse.json({ error: 'No trades provided' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const tradeSummary = trades.map((t: Record<string, unknown>) => ({
    market: t.market,
    direction: t.direction,
    setup: t.setup_type,
    outcome: t.outcome,
    pnl: t.pnl,
    r_multiple: t.r_multiple,
    grade: t.execution_grade,
    rules_followed: t.rules_followed,
    entry: t.entry_price,
    exit: t.exit_price,
    sl: t.stop_loss,
    tp: t.take_profit,
    notes: t.notes,
  }));

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a professional trading coach analyzing a trader's Gold futures (GC/MGC) journal. Analyze these ${trades.length} trades and provide:

1. **Pattern Analysis**: What setups are working best? Worst?
2. **Execution Review**: Are rules being followed? Common mistakes?
3. **Emotional Patterns**: Any signs of revenge trading, overtrading, or tilt?
4. **Edge Assessment**: What is their statistical edge? Is it real or noise?
5. **Actionable Advice**: 2-3 specific things to improve.

Keep it direct and honest. No fluff.

Trades data:
${JSON.stringify(tradeSummary, null, 2)}`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  const insight = textBlock ? textBlock.text : 'No insight generated.';

  return NextResponse.json({ insight });
}
