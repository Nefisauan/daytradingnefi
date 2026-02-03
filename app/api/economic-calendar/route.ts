import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { format, getDay, getDate } from 'date-fns';

// Static fallback events based on day of week and date patterns
function getStaticFallbackEvents(): { events: Array<Record<string, string>>; source: string } {
  const now = new Date();
  const dayOfWeek = getDay(now); // 0=Sun, 1=Mon, ...
  const dayOfMonth = getDate(now);
  const events: Array<Record<string, string>> = [];

  // Weekly recurring events
  if (dayOfWeek === 4) {
    // Thursday
    events.push({
      time: '08:30',
      currency: 'USD',
      event: 'Initial Jobless Claims',
      impact: 'medium',
      forecast: '',
      previous: '',
    });
    events.push({
      time: '08:30',
      currency: 'USD',
      event: 'Continuing Jobless Claims',
      impact: 'low',
      forecast: '',
      previous: '',
    });
  }

  // First Friday — NFP
  if (dayOfWeek === 5 && dayOfMonth <= 7) {
    events.push({
      time: '08:30',
      currency: 'USD',
      event: 'Non-Farm Payrolls (NFP)',
      impact: 'high',
      forecast: '',
      previous: '',
    });
    events.push({
      time: '08:30',
      currency: 'USD',
      event: 'Unemployment Rate',
      impact: 'high',
      forecast: '',
      previous: '',
    });
    events.push({
      time: '08:30',
      currency: 'USD',
      event: 'Average Hourly Earnings (m/m)',
      impact: 'medium',
      forecast: '',
      previous: '',
    });
  }

  // CPI — typically around 10th-14th of month
  if (dayOfMonth >= 10 && dayOfMonth <= 14 && dayOfWeek >= 2 && dayOfWeek <= 4) {
    events.push({
      time: '08:30',
      currency: 'USD',
      event: 'CPI (m/m) — Check actual schedule',
      impact: 'high',
      forecast: '',
      previous: '',
    });
    events.push({
      time: '08:30',
      currency: 'USD',
      event: 'Core CPI (m/m) — Check actual schedule',
      impact: 'high',
      forecast: '',
      previous: '',
    });
  }

  // PPI — typically around 11th-15th
  if (dayOfMonth >= 11 && dayOfMonth <= 15 && dayOfWeek >= 2 && dayOfWeek <= 4) {
    events.push({
      time: '08:30',
      currency: 'USD',
      event: 'PPI (m/m) — Check actual schedule',
      impact: 'medium',
      forecast: '',
      previous: '',
    });
  }

  // First Wednesday — ADP
  if (dayOfWeek === 3 && dayOfMonth <= 7) {
    events.push({
      time: '08:15',
      currency: 'USD',
      event: 'ADP Non-Farm Employment Change',
      impact: 'medium',
      forecast: '',
      previous: '',
    });
  }

  // First business day of month — ISM Manufacturing
  if (dayOfMonth <= 3 && dayOfWeek >= 1 && dayOfWeek <= 5) {
    events.push({
      time: '10:00',
      currency: 'USD',
      event: 'ISM Manufacturing PMI',
      impact: 'high',
      forecast: '',
      previous: '',
    });
  }

  // Third business day of month — ISM Services
  if (dayOfMonth >= 3 && dayOfMonth <= 5 && dayOfWeek >= 1 && dayOfWeek <= 5) {
    events.push({
      time: '10:00',
      currency: 'USD',
      event: 'ISM Services PMI',
      impact: 'medium',
      forecast: '',
      previous: '',
    });
  }

  // Retail sales — around 14th-17th
  if (dayOfMonth >= 14 && dayOfMonth <= 17 && dayOfWeek >= 2 && dayOfWeek <= 4) {
    events.push({
      time: '08:30',
      currency: 'USD',
      event: 'Retail Sales (m/m) — Check actual schedule',
      impact: 'high',
      forecast: '',
      previous: '',
    });
  }

  // Last Tuesday — Consumer Confidence
  if (dayOfWeek === 2 && dayOfMonth >= 24) {
    events.push({
      time: '10:00',
      currency: 'USD',
      event: 'CB Consumer Confidence',
      impact: 'medium',
      forecast: '',
      previous: '',
    });
  }

  // PCE — last Friday of month
  if (dayOfWeek === 5 && dayOfMonth >= 25) {
    events.push({
      time: '08:30',
      currency: 'USD',
      event: 'Core PCE Price Index (m/m) — Check actual schedule',
      impact: 'high',
      forecast: '',
      previous: '',
    });
  }

  // Common daily events for weekdays
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    events.push({
      time: 'Various',
      currency: 'USD',
      event: 'Fed Member Speeches — Check Fed calendar',
      impact: 'medium',
      forecast: '',
      previous: '',
    });
  }

  // Weekend
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { events: [], source: 'static' };
  }

  // Sort by time
  events.sort((a, b) => a.time.localeCompare(b.time));

  return { events, source: 'static' };
}

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Try AI-powered events first
  if (apiKey) {
    try {
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

      const textBlock = message.content.find((b) => b.type === 'text');
      const raw = textBlock?.text || '{"events": []}';
      const parsed = JSON.parse(raw);
      return NextResponse.json({ ...parsed, source: 'ai' });
    } catch {
      // AI failed — fall through to static
    }
  }

  // Fallback to static events
  const fallback = getStaticFallbackEvents();
  return NextResponse.json(fallback);
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
