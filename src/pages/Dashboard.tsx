import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Square, Clock, Plus, TrendingUp, Calendar } from 'lucide-react';
import { Card, EmptyState } from '@/components/ui';
import { CategoryBadge } from '@/components/CategoryBadge';
import { useToast } from '@/components/Toast';
import {
  fetchActivities,
  fetchActiveTimer,
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  cancelTimer,
  fetchDailyStats,
  fetchAllSessions,
  formatDuration,
  formatHumanDuration,
  formatTime,
} from '@/lib/api';
import type { Activity, ActiveTimer, DailyStats, Session } from '@/types';

interface DashboardProps {
  onNavigate: (page: 'activities' | 'history' | 'analytics') => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [timer, setTimer] = useState<ActiveTimer | null>(null);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [recent, setRecent] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [busy, setBusy] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [acts, active, daily, sessions] = await Promise.all([
        fetchActivities(),
        fetchActiveTimer(),
        fetchDailyStats(),
        fetchAllSessions(),
      ]);
      setActivities(acts);
      setTimer(active);
      setStats(daily);
      setRecent(sessions.slice(0, 5));
      if (acts.length > 0 && !selectedActivityId) {
        setSelectedActivityId(acts[0].id);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast, selectedActivityId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ticker for active timer
  useEffect(() => {
    if (timer && !timer.is_paused) {
      tickRef.current = setInterval(() => setTick((t) => t + 1), 1000);
      return () => {
        if (tickRef.current) clearInterval(tickRef.current);
      };
    }
  }, [timer]);

  // compute live elapsed
  let liveElapsed = 0;
  if (timer) {
    const start = new Date(timer.start_time).getTime();
    if (timer.is_paused && timer.paused_at) {
      const pauseEnd = new Date(timer.paused_at).getTime();
      liveElapsed = Math.max(0, (pauseEnd - start) / 1000 - timer.paused_accumulated_seconds);
    } else {
      liveElapsed = (Date.now() - start) / 1000 - timer.paused_accumulated_seconds;
    }
  }
  // tick used to force re-render
  void tick;

  const handleStart = async () => {
    const act = activities.find((a) => a.id === selectedActivityId);
    if (!act) {
      toast('Please add and select an activity first', 'error');
      return;
    }
    setBusy(true);
    try {
      const t = await startTimer(act);
      setTimer(t);
      toast(`Timer started for "${act.name}"`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to start timer', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handlePause = async () => {
    if (!timer) return;
    setBusy(true);
    try {
      const t = await pauseTimer(timer);
      setTimer(t);
      toast('Timer paused', 'info');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to pause', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleResume = async () => {
    if (!timer) return;
    setBusy(true);
    try {
      const t = await resumeTimer(timer);
      setTimer(t);
      toast('Timer resumed', 'info');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to resume', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleStop = async () => {
    if (!timer) return;
    setBusy(true);
    try {
      const session = await stopTimer(timer);
      setTimer(null);
      toast(`Session saved: ${formatHumanDuration(session.duration_seconds)}`, 'success');
      // refresh stats & recent
      const [daily, sessions] = await Promise.all([fetchDailyStats(), fetchAllSessions()]);
      setStats(daily);
      setRecent(sessions.slice(0, 5));
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to stop timer', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!timer) return;
    setBusy(true);
    try {
      await cancelTimer(timer);
      setTimer(null);
      toast('Timer cancelled', 'info');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to cancel', 'error');
    } finally {
      setBusy(false);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-stone-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-stone-800 tracking-tight">
            {greeting}, Apurva
          </h1>
          <p className="text-sm text-stone-400 mt-1 flex items-center gap-1.5">
            <Calendar className="w-4 h-4" /> {today}
          </p>
        </div>
      </div>

      {/* Timer card */}
      <Card className="overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-semibold text-stone-700">Active Timer</h3>
            </div>
            {timer && (
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  timer.is_paused ? 'bg-orange-50 text-orange-600' : 'bg-teal-50 text-teal-600'
                }`}
              >
                {timer.is_paused ? 'Paused' : 'Running'}
              </span>
            )}
          </div>

          {!timer ? (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedActivityId}
                  onChange={(e) => setSelectedActivityId(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                >
                  {activities.length === 0 && <option value="">No activities yet — add one first</option>}
                  {activities.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.category})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleStart}
                  disabled={busy || activities.length === 0}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                >
                  <Play className="w-4 h-4" /> Start
                </button>
              </div>
              {activities.length === 0 && (
                <button
                  onClick={() => onNavigate('activities')}
                  className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  <Plus className="w-4 h-4" /> Add your first activity
                </button>
              )}
              <div className="text-center py-4">
                <p className="text-5xl md:text-6xl font-mono font-light text-stone-300 tracking-wider">
                  00:00:00
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex-1">
                  <p className="text-lg font-semibold text-stone-800">{timer.activity_name}</p>
                  <div className="mt-1">
                    <CategoryBadge category={timer.category} />
                  </div>
                </div>
              </div>

              <div className="text-center py-2">
                <p
                  className={`text-5xl md:text-7xl font-mono font-light tracking-wider ${
                    timer.is_paused ? 'text-stone-400' : 'text-teal-700'
                  }`}
                >
                  {formatDuration(liveElapsed)}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                {!timer.is_paused ? (
                  <button
                    onClick={handlePause}
                    disabled={busy}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-all shadow-sm"
                  >
                    <Pause className="w-4 h-4" /> Pause
                  </button>
                ) : (
                  <button
                    onClick={handleResume}
                    disabled={busy}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-all shadow-sm"
                  >
                    <Play className="w-4 h-4" /> Resume
                  </button>
                )}
                <button
                  onClick={handleStop}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-700 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-all shadow-sm"
                >
                  <Square className="w-4 h-4" /> Stop & Save
                </button>
                <button
                  onClick={handleCancel}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-stone-200 text-stone-500 text-sm font-medium hover:bg-stone-50 disabled:opacity-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Today"
          value={stats ? formatHumanDuration(stats.today_seconds) : '0s'}
          accent="teal"
        />
        <StatCard
          label="Yesterday"
          value={stats ? formatHumanDuration(stats.yesterday_seconds) : '0s'}
          accent="stone"
        />
        <StatCard
          label="This Week"
          value={stats ? formatHumanDuration(stats.week_seconds) : '0s'}
          accent="orange"
        />
      </div>

      {/* Category summary + Recent history */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-stone-700">Today by Category</h3>
            <TrendingUp className="w-5 h-5 text-stone-300" />
          </div>
          {stats && stats.today_by_category.length > 0 ? (
            <div className="space-y-3">
              {stats.today_by_category.map((c) => (
                <div key={c.category}>
                  <div className="flex items-center justify-between mb-1.5">
                    <CategoryBadge category={c.category as never} />
                    <span className="text-sm font-medium text-stone-600">
                      {formatHumanDuration(c.total_seconds)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${c.percentage}%`,
                        backgroundColor: CATEGORY_BG_HEX[c.category] ?? '#78716c',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<TrendingUp className="w-6 h-6" />}
              title="No tracked time today"
              message="Start a timer to see your category breakdown."
            />
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-stone-700">Recent Sessions</h3>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs font-medium text-teal-600 hover:text-teal-700"
            >
              View all
            </button>
          </div>
          {recent.length > 0 ? (
            <div className="space-y-3">
              {recent.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-10 rounded-full" style={{ backgroundColor: CATEGORY_BG_HEX[s.category] ?? '#78716c' }} />
                    <div>
                      <p className="text-sm font-medium text-stone-700">{s.activity_name}</p>
                      <p className="text-xs text-stone-400">
                        {formatTime(s.start_time)} — {formatTime(s.end_time)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-medium text-stone-600">
                      {formatHumanDuration(s.duration_seconds)}
                    </p>
                    <CategoryBadge category={s.category} className="mt-0.5" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Clock className="w-6 h-6" />}
              title="No sessions yet"
              message="Complete a timer to see your history here."
            />
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: 'teal' | 'stone' | 'orange' }) {
  const colors = {
    teal: 'text-teal-700',
    stone: 'text-stone-700',
    orange: 'text-orange-600',
  };
  return (
    <Card className="p-5">
      <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${colors[accent]}`}>{value}</p>
    </Card>
  );
}

const CATEGORY_BG_HEX: Record<string, string> = {
  Development: '#0d9488',
  Design: '#f97316',
  Study: '#3b82f6',
  Meeting: '#a855f7',
  Research: '#eab308',
  Other: '#78716c',
};
