// ── Enums / union types ──────────────────────────────────────────────

export type MarketType = 'GC' | 'MGC' | string;
export type Direction = 'long' | 'short';
export type ExecutionGrade = 'A' | 'B' | 'C' | 'F';
export type Outcome = 'win' | 'loss' | 'breakeven';
export type MarketBias = 'bullish' | 'bearish' | 'neutral';
export type RuleType = 'trade' | 'avoid' | 'execution' | 'insight';
export type EmotionLevel = 'calm' | 'focused' | 'anxious' | 'frustrated' | 'tilted';

export const SETUP_TYPES = [
  'FVG',
  'IB',
  'OB',
  'BOS',
  'CHoCH',
  'Liquidity Sweep',
  'ICT Silver Bullet',
  'London Open',
  'NY Open',
  'Other',
] as const;

export type SetupType = (typeof SETUP_TYPES)[number];

export const MARKETS: { value: MarketType; label: string }[] = [
  { value: 'GC', label: 'Gold (GC)' },
  { value: 'MGC', label: 'Micro Gold (MGC)' },
  { value: 'ES', label: 'S&P 500 (ES)' },
  { value: 'MES', label: 'Micro S&P 500 (MES)' },
];

// ── Database models ──────────────────────────────────────────────────

export interface Profile {
  id: string;
  display_name: string | null;
  default_market: MarketType;
  default_position_size: number | null;
  account_size: number | null;
  risk_per_trade: number;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Trade {
  id: string;
  user_id: string;
  market: MarketType;
  direction: Direction;
  setup_type: string;
  entry_price: number | null;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  position_size: number | null;
  entry_time: string | null;
  exit_time: string | null;
  execution_grade: ExecutionGrade | null;
  outcome: Outcome | null;
  pnl: number | null;
  r_multiple: number | null;
  rules_followed: boolean;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
}

export interface TradeScreenshot {
  id: string;
  trade_id: string;
  user_id: string;
  storage_path: string;
  label: string | null;
  created_at: string;
}

export interface RuleCheck {
  id: string;
  trade_id: string;
  user_id: string;
  followed_rules: boolean | null;
  waited_confirmation: boolean | null;
  emotion_in_check: boolean | null;
  valid_setup: boolean | null;
  notes: string | null;
  created_at: string;
}

export interface Reflection {
  id: string;
  user_id: string;
  trade_id: string | null;
  reflection_date: string;
  pre_emotion: EmotionLevel | null;
  during_emotion: EmotionLevel | null;
  post_emotion: EmotionLevel | null;
  what_confirmed: string | null;
  what_tempted: string | null;
  what_improve: string | null;
  ai_insight: string | null;
  notes: string | null;
  created_at: string;
}

export interface SessionPlan {
  id: string;
  user_id: string;
  plan_date: string;
  market_bias: MarketBias | null;
  htf_levels: KeyLevel[] | null;
  ltf_levels: KeyLevel[] | null;
  liquidity_zones: LiquidityZone[] | null;
  max_trades: number;
  news_events: NewsEvent[] | null;
  notes: string | null;
  eod_journal_done: boolean;
  eod_replay_done: boolean;
  eod_playbook_done: boolean;
  eod_session_rating: number | null;
  created_at: string;
}

export interface KeyLevel {
  price: number;
  label: string;
  type: 'support' | 'resistance' | 'poi';
}

export interface LiquidityZone {
  price_start: number;
  price_end: number;
  label: string;
}

export interface NewsEvent {
  time: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  expected?: string;
  actual?: string;
}

export interface PlaybookEntry {
  id: string;
  user_id: string;
  rule_type: RuleType;
  title: string;
  description: string | null;
  setup_type: string | null;
  conditions: Record<string, unknown> | null;
  evidence_trade_ids: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Streak {
  id: string;
  user_id: string;
  streak_type: string;
  current_count: number;
  best_count: number;
  last_logged_date: string | null;
  updated_at: string;
}

// ── Form / UI types ──────────────────────────────────────────────────

export interface TradeFormData {
  market: MarketType;
  direction: Direction;
  setup_type: string;
  entry_price: string;
  exit_price: string;
  stop_loss: string;
  take_profit: string;
  position_size: string;
  entry_time: string;
  exit_time: string;
  execution_grade: ExecutionGrade | '';
  outcome: Outcome | '';
  pnl: string;
  r_multiple: string;
  notes: string;
  tags: string;
}

export interface RuleCheckFormData {
  followed_rules: boolean;
  waited_confirmation: boolean;
  emotion_in_check: boolean;
  valid_setup: boolean;
  notes: string;
}

export interface ReflectionFormData {
  trade_id: string;
  pre_emotion: EmotionLevel | '';
  during_emotion: EmotionLevel | '';
  post_emotion: EmotionLevel | '';
  what_confirmed: string;
  what_tempted: string;
  what_improve: string;
  notes: string;
}

export interface SessionPlanFormData {
  market_bias: MarketBias | '';
  htf_levels: string;
  ltf_levels: string;
  liquidity_zones: string;
  max_trades: string;
  notes: string;
}

// ── Stats types ──────────────────────────────────────────────────────

export interface DashboardStatsData {
  totalTrades: number;
  winRate: number;
  avgRR: number;
  totalPnl: number;
  bestDay: { date: string; pnl: number } | null;
  worstDay: { date: string; pnl: number } | null;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
}

export interface EconomicEvent {
  id: string;
  time: string;
  currency: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  forecast?: string;
  previous?: string;
  actual?: string;
}

export type TabId = 'log' | 'history' | 'reflect' | 'dashboard' | 'plan' | 'trade-calendar' | 'calendar' | 'playbook' | 'chat' | 'potential' | 'calculator';

export type MissedReason = 'Hesitation' | 'Doubt' | 'Distraction' | 'Missed signal';

export interface PotentialTrade {
  id: string;
  user_id: string;
  market: MarketType;
  direction: Direction;
  setup_type: string;
  entry_price: number | null;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  potential_pnl: number | null;
  r_multiple: number | null;
  entry_time: string | null;
  reason: MissedReason | null;
  notes: string | null;
  created_at: string;
}

export interface PotentialTradeFormData {
  market: MarketType;
  direction: Direction;
  setup_type: string;
  entry_price: string;
  exit_price: string;
  stop_loss: string;
  take_profit: string;
  potential_pnl: string;
  r_multiple: string;
  entry_time: string;
  reason: MissedReason | '';
  notes: string;
}
