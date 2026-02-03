import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { format } from 'date-fns';

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ events: [], error: 'ANTHROPIC_API_KEY not configured' });
  }

  const client = new Anthropic({ apiKey });
  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Today is ${today}. List the economic calendar events scheduled for today that are relevant to Gold (GC) futures trading. Focus on USD events and major global events that move Gold.

Return ONLY valid JSON in this exact format, no other text:
{
  "events": [
    {
      "time": "08:30",
      "currency": "USD",
      "event": "Event Name",
      "impact": "high",
      "forecast": "value or empty string",
      "previous": "value or empty string"
    }
  ]
}

Rules:
- Times in ET (Eastern Time), 24hr format not needed, use HH:MM AM/PM style like "08:30" or "14:00"
- Impact must be "high", "medium", or "low"
- Only include events actually scheduled for today
- If no events today, return {"events": []}
- Include: NFP, CPI, PPI, FOMC, GDP, PCE, jobless claims, ISM, retail sales, consumer confidence, Fed speeches, etc.
- Only events that are actually on today's calendar, not every possible event`,
      },
    ],
  });

  try {
    const textBlock = message.content.find((b) => b.type === 'text');
    const raw = textBlock?.text || '{"events": []}';
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ events: [] });
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ explanation: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const { event, type } = await request.json();
  const client = new Anthropic({ apiKey });

  const prompt = type === 'brief'
    ? `You are a Gold futures trading analyst. Today's economic events: ${JSON.stringify(event)}

Provide a concise market brief for Gold (GC/MGC) traders:
1. Overall market sentiment for today based on these events
2. Key times to be cautious (no-trade zones)
3. How Gold might react to each high-impact event
4. Recommended approach (aggressive, defensive, sit out)

Keep it under 300 words. Be direct and actionable.`
    : `You are a Gold futures trading analyst. Explain how this economic event affects Gold prices:

Event: ${event.event}
Time: ${event.time} ET
Impact: ${event.impact}
${event.forecast ? `Forecast: ${event.forecast}` : ''}
${event.previous ? `Previous: ${event.previous}` : ''}

Explain in 2-3 sentences:
1. What this event measures
2. How it typically moves Gold (higher/lower and why)
3. What to watch for (beat vs miss expectations)

Be specific to Gold trading. Keep it concise.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  return NextResponse.json({ explanation: textBlock?.text || 'No explanation generated.' });
}
