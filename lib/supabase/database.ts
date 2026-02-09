import { SupabaseClient } from '@supabase/supabase-js';
import {
  Profile,
  Trade,
  TradeFormData,
  RuleCheck,
  RuleCheckFormData,
  Reflection,
  ReflectionFormData,
  SessionPlan,
  SessionPlanFormData,
  PlaybookEntry,
  Streak,
  KeyLevel,
  LiquidityZone,
  PotentialTrade,
  PotentialTradeFormData,
} from '../types';

// ── Profile ──────────────────────────────────────────────────────────

export async function loadProfile(supabase: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

export async function upsertProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: Partial<Profile>
): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
    .select()
    .single();
  return data;
}

// ── Trades ───────────────────────────────────────────────────────────

export async function createTrade(
  supabase: SupabaseClient,
  userId: string,
  form: TradeFormData
): Promise<Trade | null> {
  const { data } = await supabase
    .from('trades')
    .insert({
      user_id: userId,
      market: form.market,
      direction: form.direction,
      setup_type: form.setup_type,
      entry_price: form.entry_price ? parseFloat(form.entry_price) : null,
      exit_price: form.exit_price ? parseFloat(form.exit_price) : null,
      stop_loss: form.stop_loss ? parseFloat(form.stop_loss) : null,
      take_profit: form.take_profit ? parseFloat(form.take_profit) : null,
      position_size: form.position_size ? parseFloat(form.position_size) : null,
      entry_time: form.entry_time || null,
      exit_time: form.exit_time || null,
      execution_grade: form.execution_grade || null,
      outcome: form.outcome || null,
      pnl: form.pnl ? parseFloat(form.pnl) : null,
      r_multiple: form.r_multiple ? parseFloat(form.r_multiple) : null,
      notes: form.notes || null,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : null,
    })
    .select()
    .single();
  return data;
}

export async function loadTrades(
  supabase: SupabaseClient,
  userId: string,
  options?: { limit?: number; offset?: number; startDate?: string; endDate?: string; setup?: string; outcome?: string }
): Promise<Trade[]> {
  let query = supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (options?.startDate) query = query.gte('entry_time', options.startDate);
  if (options?.endDate) query = query.lte('entry_time', options.endDate);
  if (options?.setup) query = query.eq('setup_type', options.setup);
  if (options?.outcome) query = query.eq('outcome', options.outcome);
  if (options?.limit) query = query.limit(options.limit);
  if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 50) - 1);

  const { data } = await query;
  return data || [];
}

export async function updateTrade(
  supabase: SupabaseClient,
  tradeId: string,
  form: TradeFormData
): Promise<Trade | null> {
  const { data } = await supabase
    .from('trades')
    .update({
      market: form.market,
      direction: form.direction,
      setup_type: form.setup_type,
      entry_price: form.entry_price ? parseFloat(form.entry_price) : null,
      exit_price: form.exit_price ? parseFloat(form.exit_price) : null,
      stop_loss: form.stop_loss ? parseFloat(form.stop_loss) : null,
      take_profit: form.take_profit ? parseFloat(form.take_profit) : null,
      position_size: form.position_size ? parseFloat(form.position_size) : null,
      entry_time: form.entry_time || null,
      exit_time: form.exit_time || null,
      execution_grade: form.execution_grade || null,
      outcome: form.outcome || null,
      pnl: form.pnl ? parseFloat(form.pnl) : null,
      r_multiple: form.r_multiple ? parseFloat(form.r_multiple) : null,
      notes: form.notes || null,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : null,
    })
    .eq('id', tradeId)
    .select()
    .single();
  return data;
}

export async function deleteTrade(supabase: SupabaseClient, tradeId: string): Promise<boolean> {
  const { error } = await supabase.from('trades').delete().eq('id', tradeId);
  return !error;
}

// ── Screenshots ──────────────────────────────────────────────────────

export async function uploadTradeScreenshot(
  supabase: SupabaseClient,
  userId: string,
  tradeId: string,
  file: File,
  label?: string
): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'png';
  const path = `${userId}/${tradeId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('trade-screenshots')
    .upload(path, file, { upsert: true });

  if (uploadError) return null;

  const { error: insertError } = await supabase.from('trade_screenshots').insert({
    trade_id: tradeId,
    user_id: userId,
    storage_path: path,
    label: label || null,
  });

  return insertError ? null : path;
}

export async function loadTradeScreenshots(
  supabase: SupabaseClient,
  tradeId: string
): Promise<{ path: string; url: string; label: string | null }[]> {
  const { data: records } = await supabase
    .from('trade_screenshots')
    .select('storage_path, label')
    .eq('trade_id', tradeId);

  if (!records?.length) return [];

  const results: { path: string; url: string; label: string | null }[] = [];
  for (const r of records) {
    const { data: signed } = await supabase.storage
      .from('trade-screenshots')
      .createSignedUrl(r.storage_path, 3600);
    if (signed?.signedUrl) {
      results.push({ path: r.storage_path, url: signed.signedUrl, label: r.label });
    }
  }
  return results;
}

// ── Rule Checks ──────────────────────────────────────────────────────

export async function saveRuleCheck(
  supabase: SupabaseClient,
  userId: string,
  tradeId: string,
  form: RuleCheckFormData
): Promise<RuleCheck | null> {
  const { data } = await supabase
    .from('rule_checks')
    .insert({
      trade_id: tradeId,
      user_id: userId,
      followed_rules: form.followed_rules,
      waited_confirmation: form.waited_confirmation,
      emotion_in_check: form.emotion_in_check,
      valid_setup: form.valid_setup,
      notes: form.notes || null,
    })
    .select()
    .single();
  return data;
}

// ── Reflections ──────────────────────────────────────────────────────

export async function saveReflection(
  supabase: SupabaseClient,
  userId: string,
  form: ReflectionFormData
): Promise<Reflection | null> {
  const { data } = await supabase
    .from('reflections')
    .insert({
      user_id: userId,
      trade_id: form.trade_id || null,
      pre_emotion: form.pre_emotion || null,
      during_emotion: form.during_emotion || null,
      post_emotion: form.post_emotion || null,
      what_confirmed: form.what_confirmed || null,
      what_tempted: form.what_tempted || null,
      what_improve: form.what_improve || null,
      notes: form.notes || null,
    })
    .select()
    .single();
  return data;
}

export async function loadReflections(
  supabase: SupabaseClient,
  userId: string,
  options?: { tradeId?: string; limit?: number }
): Promise<Reflection[]> {
  let query = supabase
    .from('reflections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (options?.tradeId) query = query.eq('trade_id', options.tradeId);
  if (options?.limit) query = query.limit(options.limit);

  const { data } = await query;
  return data || [];
}

// ── Session Plans ────────────────────────────────────────────────────

function parseJsonLevels(str: string): KeyLevel[] {
  if (!str.trim()) return [];
  return str.split('\n').filter(Boolean).map((line) => {
    const parts = line.split('@');
    const price = parseFloat(parts[1]?.trim() || '0');
    return { price, label: parts[0]?.trim() || '', type: 'poi' as const };
  });
}

function parseJsonZones(str: string): LiquidityZone[] {
  if (!str.trim()) return [];
  return str.split('\n').filter(Boolean).map((line) => {
    const parts = line.split('-');
    return {
      price_start: parseFloat(parts[0]?.trim() || '0'),
      price_end: parseFloat(parts[1]?.trim() || '0'),
      label: parts[2]?.trim() || '',
    };
  });
}

export async function saveSessionPlan(
  supabase: SupabaseClient,
  userId: string,
  form: SessionPlanFormData
): Promise<SessionPlan | null> {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('session_plans')
    .upsert(
      {
        user_id: userId,
        plan_date: today,
        market_bias: form.market_bias || null,
        htf_levels: parseJsonLevels(form.htf_levels),
        ltf_levels: parseJsonLevels(form.ltf_levels),
        liquidity_zones: parseJsonZones(form.liquidity_zones),
        max_trades: parseInt(form.max_trades) || 3,
        notes: form.notes || null,
      },
      { onConflict: 'user_id,plan_date' }
    )
    .select()
    .single();
  return data;
}

export async function loadSessionPlan(
  supabase: SupabaseClient,
  userId: string,
  date?: string
): Promise<SessionPlan | null> {
  const d = date || new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('session_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('plan_date', d)
    .single();
  return data;
}

export async function updateEndOfDay(
  supabase: SupabaseClient,
  planId: string,
  updates: { eod_journal_done?: boolean; eod_replay_done?: boolean; eod_playbook_done?: boolean; eod_session_rating?: number }
): Promise<boolean> {
  const { error } = await supabase.from('session_plans').update(updates).eq('id', planId);
  return !error;
}

// ── Playbook ─────────────────────────────────────────────────────────

export async function loadPlaybook(supabase: SupabaseClient, userId: string): Promise<PlaybookEntry[]> {
  const { data } = await supabase
    .from('playbook_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function savePlaybookEntry(
  supabase: SupabaseClient,
  userId: string,
  entry: Omit<PlaybookEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<PlaybookEntry | null> {
  const { data } = await supabase
    .from('playbook_entries')
    .insert({ user_id: userId, ...entry })
    .select()
    .single();
  return data;
}

// ── Streaks ──────────────────────────────────────────────────────────

export async function loadStreaks(supabase: SupabaseClient, userId: string): Promise<Streak[]> {
  const { data } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId);
  return data || [];
}

export async function updateStreak(
  supabase: SupabaseClient,
  userId: string,
  streakType: string
): Promise<Streak | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .eq('streak_type', streakType)
    .single();

  if (existing) {
    if (existing.last_logged_date === today) return existing;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];

    const newCount = existing.last_logged_date === yStr ? existing.current_count + 1 : 1;
    const newBest = Math.max(newCount, existing.best_count);

    const { data } = await supabase
      .from('streaks')
      .update({ current_count: newCount, best_count: newBest, last_logged_date: today, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    return data;
  }

  const { data } = await supabase
    .from('streaks')
    .insert({ user_id: userId, streak_type: streakType, current_count: 1, best_count: 1, last_logged_date: today })
    .select()
    .single();
  return data;
}

// ── Potential Trades ────────────────────────────────────────────────

export async function createPotentialTrade(
  supabase: SupabaseClient,
  userId: string,
  form: PotentialTradeFormData
): Promise<PotentialTrade | null> {
  const { data } = await supabase
    .from('potential_trades')
    .insert({
      user_id: userId,
      market: form.market,
      direction: form.direction,
      setup_type: form.setup_type,
      entry_price: parseFloat(form.entry_price) || null,
      exit_price: parseFloat(form.exit_price) || null,
      stop_loss: parseFloat(form.stop_loss) || null,
      take_profit: parseFloat(form.take_profit) || null,
      potential_pnl: parseFloat(form.potential_pnl) || null,
      r_multiple: parseFloat(form.r_multiple) || null,
      entry_time: form.entry_time || null,
      reason: form.reason || null,
      notes: form.notes || null,
    })
    .select()
    .single();
  return data;
}

export async function loadPotentialTrades(
  supabase: SupabaseClient,
  userId: string,
  options?: { limit?: number }
): Promise<PotentialTrade[]> {
  const { data } = await supabase
    .from('potential_trades')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(options?.limit || 100);
  return data || [];
}

export async function deletePotentialTrade(
  supabase: SupabaseClient,
  tradeId: string
): Promise<void> {
  await supabase.from('potential_trades').delete().eq('id', tradeId);
}
