'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Trade,
  Profile,
  Reflection,
  PotentialTrade,
  PotentialTradeFormData,
  TabId,
  TradeFormData,
  RuleCheckFormData,
  ReflectionFormData,
  SessionPlanFormData,
  PlaybookEntry,
  Streak,
  SessionPlan,
  RuleType,
} from '@/lib/types';
import {
  loadProfile,
  upsertProfile,
  createTrade,
  updateTrade,
  loadTrades,
  saveRuleCheck,
  saveReflection,
  saveSessionPlan,
  loadSessionPlan,
  updateEndOfDay,
  loadPlaybook,
  savePlaybookEntry,
  loadStreaks,
  updateStreak,
  loadReflections,
  createPotentialTrade,
  loadPotentialTrades,
  deletePotentialTrade,
} from '@/lib/supabase/database';
import AuthButton from './AuthButton';
import StreakTracker from './StreakTracker';
import TradeForm from './TradeForm';
import RuleChecklist from './RuleChecklist';
import TradeLog from './TradeLog';
import DashboardStats from './DashboardStats';
import EdgeDashboard from './EdgeDashboard';
import ReflectionForm from './ReflectionForm';
import SessionPlanner from './SessionPlanner';
import EndOfDayChecklist from './EndOfDayChecklist';
import EconomicCalendar from './EconomicCalendar';
import PlaybookView from './PlaybookView';
import AIInsights from './AIInsights';
import ScreenshotUpload from './ScreenshotUpload';
import TradeCalendar from './TradeCalendar';
import TradingChat from './TradingChat';
import PotentialTradeForm from './PotentialTradeForm';
import PotentialTradeLog from './PotentialTradeLog';

const TABS: { id: TabId; label: string }[] = [
  { id: 'log', label: 'Log Trade' },
  { id: 'history', label: 'History' },
  { id: 'reflect', label: 'Reflect' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'plan', label: 'Plan' },
  { id: 'trade-calendar', label: 'Trade Cal' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'playbook', label: 'Playbook' },
  { id: 'potential', label: 'Potential' },
  { id: 'chat', label: 'Coach' },
];

interface Props {
  userId: string;
  userEmail: string;
}

export default function HomeClient({ userId, userEmail }: Props) {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [activeTab, setActiveTab] = useState<TabId>('log');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [playbook, setPlaybookEntries] = useState<PlaybookEntry[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [sessionPlan, setSessionPlan] = useState<SessionPlan | null>(null);
  const [ruleCheckTradeId, setRuleCheckTradeId] = useState<string | null>(null);
  const [lastTradeId, setLastTradeId] = useState<string | null>(null);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [potentialTrades, setPotentialTrades] = useState<PotentialTrade[]>([]);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Load data on mount ─────────────────────────────────────────────
  const loadAllData = useCallback(async () => {
    setLoading(true);
    const [profileData, tradesData, playbookData, streaksData, planData, reflectionsData, potentialData] = await Promise.all([
      loadProfile(supabase, userId),
      loadTrades(supabase, userId, { limit: 200 }),
      loadPlaybook(supabase, userId),
      loadStreaks(supabase, userId),
      loadSessionPlan(supabase, userId),
      loadReflections(supabase, userId, { limit: 500 }),
      loadPotentialTrades(supabase, userId),
    ]);
    setProfile(profileData);
    setTrades(tradesData);
    setPlaybookEntries(playbookData);
    setStreaks(streaksData);
    setSessionPlan(planData);
    setReflections(reflectionsData);
    setPotentialTrades(potentialData);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ── Ensure profile exists ──────────────────────────────────────────
  useEffect(() => {
    if (!loading && !profile) {
      upsertProfile(supabase, userId, { display_name: userEmail.split('@')[0] });
    }
  }, [loading, profile, supabase, userId, userEmail]);

  // ── Handlers ───────────────────────────────────────────────────────
  const handleLogTrade = async (form: TradeFormData): Promise<string | null> => {
    const trade = await createTrade(supabase, userId, form);
    if (trade) {
      setTrades((prev) => [trade, ...prev]);
      setLastTradeId(trade.id);
      await updateStreak(supabase, userId, 'trades_logged');
      const s = await loadStreaks(supabase, userId);
      setStreaks(s);
      return trade.id;
    }
    return null;
  };

  const handleUpdateTrade = async (form: TradeFormData): Promise<string | null> => {
    if (!editingTrade) return null;
    const updated = await updateTrade(supabase, editingTrade.id, form);
    if (updated) {
      setTrades((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      return updated.id;
    }
    return null;
  };

  const handleTradeClick = (trade: Trade) => {
    setEditingTrade(trade);
    setActiveTab('log');
  };

  const handleCancelEdit = () => {
    setEditingTrade(null);
  };

  const handleRuleCheck = (tradeId: string) => {
    setRuleCheckTradeId(tradeId);
  };

  const handleRuleCheckSubmit = async (tradeId: string, form: RuleCheckFormData) => {
    await saveRuleCheck(supabase, userId, tradeId, form);
  };

  const handleReflection = async (form: ReflectionFormData) => {
    await saveReflection(supabase, userId, form);
    await updateStreak(supabase, userId, 'reflections');
    const [s, r] = await Promise.all([
      loadStreaks(supabase, userId),
      loadReflections(supabase, userId, { limit: 500 }),
    ]);
    setStreaks(s);
    setReflections(r);
  };

  const handleSessionPlan = async (form: SessionPlanFormData) => {
    const plan = await saveSessionPlan(supabase, userId, form);
    setSessionPlan(plan);
    await updateStreak(supabase, userId, 'session_plans');
    const s = await loadStreaks(supabase, userId);
    setStreaks(s);
  };

  const handleEndOfDay = async (
    planId: string,
    updates: { eod_journal_done: boolean; eod_replay_done: boolean; eod_playbook_done: boolean; eod_session_rating: number }
  ) => {
    await updateEndOfDay(supabase, planId, updates);
    const plan = await loadSessionPlan(supabase, userId);
    setSessionPlan(plan);
  };

  const handleAddPlaybook = async (entry: { rule_type: RuleType; title: string; description: string; setup_type: string }) => {
    const saved = await savePlaybookEntry(supabase, userId, {
      ...entry,
      conditions: null,
      evidence_trade_ids: null,
      is_active: true,
    });
    if (saved) {
      setPlaybookEntries((prev) => [saved, ...prev]);
    }
  };

  const handleLogPotentialTrade = async (form: PotentialTradeFormData): Promise<string | null> => {
    const trade = await createPotentialTrade(supabase, userId, form);
    if (trade) {
      setPotentialTrades((prev) => [trade, ...prev]);
      return trade.id;
    }
    return null;
  };

  const handleDeletePotentialTrade = async (id: string) => {
    await deletePotentialTrade(supabase, id);
    setPotentialTrades((prev) => prev.filter((t) => t.id !== id));
  };

  // ── Render ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-dim flex items-center justify-center">
              <span className="text-sm font-bold text-background">TE</span>
            </div>
            <span className="font-bold text-lg hidden sm:block">Trading Edge</span>
          </div>
          <AuthButton displayName={profile?.display_name} />
        </div>

        {/* Streak bar */}
        <div className="max-w-4xl mx-auto px-4 pb-2">
          <StreakTracker streaks={streaks} />
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors rounded-t-lg ${
                activeTab === tab.id
                  ? 'text-accent tab-active'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {/* Rule checklist overlay */}
        {ruleCheckTradeId && (
          <div className="mb-6">
            <RuleChecklist
              tradeId={ruleCheckTradeId}
              onSubmit={handleRuleCheckSubmit}
              onClose={() => setRuleCheckTradeId(null)}
            />
          </div>
        )}

        {activeTab === 'log' && (
          <div className="space-y-6">
            <TradeForm
              key={editingTrade?.id || 'new'}
              onSubmit={editingTrade ? handleUpdateTrade : handleLogTrade}
              onRuleCheck={editingTrade ? undefined : handleRuleCheck}
              defaultMarket={profile?.default_market || 'GC'}
              editTrade={editingTrade}
              onCancelEdit={handleCancelEdit}
            />
            {(lastTradeId || editingTrade) && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted">Attach Screenshots</h3>
                <ScreenshotUpload
                  tradeId={editingTrade?.id || lastTradeId!}
                  userId={userId}
                  supabase={supabase}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <TradeLog trades={trades} reflections={reflections} onTradeClick={handleTradeClick} />
        )}

        {activeTab === 'trade-calendar' && (
          <TradeCalendar
            trades={trades}
            reflections={reflections}
            supabase={supabase}
            userId={userId}
            onTradeClick={handleTradeClick}
          />
        )}

        {activeTab === 'reflect' && (
          <ReflectionForm trades={trades} onSubmit={handleReflection} />
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <DashboardStats trades={trades} />
            <EdgeDashboard trades={trades} />
            <AIInsights trades={trades} />
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="space-y-6">
            <SessionPlanner onSubmit={handleSessionPlan} />
            <EndOfDayChecklist
              planId={sessionPlan?.id || null}
              initialValues={sessionPlan ? {
                eod_journal_done: sessionPlan.eod_journal_done,
                eod_replay_done: sessionPlan.eod_replay_done,
                eod_playbook_done: sessionPlan.eod_playbook_done,
                eod_session_rating: sessionPlan.eod_session_rating,
              } : undefined}
              onSubmit={handleEndOfDay}
            />
          </div>
        )}

        {activeTab === 'calendar' && (
          <EconomicCalendar />
        )}

        {activeTab === 'playbook' && (
          <PlaybookView entries={playbook} onAdd={handleAddPlaybook} />
        )}

        {activeTab === 'potential' && (
          <div className="space-y-6">
            <PotentialTradeForm
              onSubmit={handleLogPotentialTrade}
              defaultMarket={profile?.default_market || 'GC'}
            />
            <PotentialTradeLog
              trades={potentialTrades}
              userId={userId}
              supabase={supabase}
              onDelete={handleDeletePotentialTrade}
            />
          </div>
        )}

        {activeTab === 'chat' && (
          <TradingChat />
        )}
      </main>
    </div>
  );
}
