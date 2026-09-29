import { supabase } from './supabase';
import type {
  Activity,
  Session,
  ActiveTimer,
  CategoryAgg,
  DailyStats,
  HistoryItem,
  Category,
} from '@/types';
import { CATEGORIES } from '@/types';

/* ---------- Activities ---------- */

export async function fetchActivities(): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createActivity(input: {
  name: string;
  category: Category;
  description?: string;
}): Promise<Activity> {
  const { data, error } = await supabase
    .from('activities')
    .insert({
      name: input.name.trim(),
      category: input.category,
      description: input.description?.trim() ?? '',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteActivity(id: string): Promise<void> {
  const { error } = await supabase.from('activities').delete().eq('id', id);
  if (error) throw error;
}

/* ---------- Active timer ---------- */

export async function fetchActiveTimer(): Promise<ActiveTimer | null> {
  const { data, error } = await supabase
    .from('active_timer')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function startTimer(activity: Activity): Promise<ActiveTimer> {
  // remove any existing timer first
  const { error: delErr } = await supabase.from('active_timer').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) throw delErr;

  const { data, error } = await supabase
    .from('active_timer')
    .insert({
      activity_id: activity.id,
      activity_name: activity.name,
      category: activity.category,
      start_time: new Date().toISOString(),
      is_paused: false,
      paused_accumulated_seconds: 0,
      paused_at: null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function pauseTimer(timer: ActiveTimer): Promise<ActiveTimer> {
  if (timer.is_paused) return timer;
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('active_timer')
    .update({
      is_paused: true,
      paused_at: now,
    })
    .eq('id', timer.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function resumeTimer(timer: ActiveTimer): Promise<ActiveTimer> {
  if (!timer.is_paused) return timer;
  const { data, error } = await supabase
    .from('active_timer')
    .update({
      is_paused: false,
      paused_at: null,
    })
    .eq('id', timer.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function stopTimer(timer: ActiveTimer): Promise<Session> {
  const now = new Date();
  const start = new Date(timer.start_time);

  let elapsed = (now.getTime() - start.getTime()) / 1000;
  if (timer.is_paused && timer.paused_at) {
    // if paused, stop at the pause moment
    const pausedAt = new Date(timer.paused_at);
    elapsed = (pausedAt.getTime() - start.getTime()) / 1000;
  }
  const accumulated = timer.paused_accumulated_seconds ?? 0;
  const duration = Math.max(0, Math.floor(elapsed - accumulated));

  // If timer was paused, the elapsed is already (pause - start) - accumulated.
  // If not paused, elapsed is (now - start) - accumulated.
  const finalDuration = timer.is_paused
    ? Math.max(0, Math.floor((new Date(timer.paused_at!).getTime() - start.getTime()) / 1000) - accumulated)
    : duration;

  const session: Omit<Session, 'id' | 'created_at'> = {
    activity_id: timer.activity_id,
    activity_name: timer.activity_name,
    category: timer.category,
    start_time: timer.start_time,
    end_time: timer.is_paused ? timer.paused_at! : now.toISOString(),
    duration_seconds: finalDuration,
  };

  const { data, error } = await supabase
    .from('sessions')
    .insert(session)
    .select()
    .single();
  if (error) throw error;

  // delete the active timer
  const { error: delErr } = await supabase.from('active_timer').delete().eq('id', timer.id);
  if (delErr) throw delErr;

  return data;
}

export async function cancelTimer(timer: ActiveTimer): Promise<void> {
  const { error } = await supabase.from('active_timer').delete().eq('id', timer.id);
  if (error) throw error;
}

/* ---------- Analytics ---------- */

export async function fetchAllSessions(): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('start_time', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchDailyStats(): Promise<DailyStats> {
  const sessions = await fetchAllSessions();
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const startOfWeek = new Date(startOfToday);
  const dayOfWeek = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

  let today_seconds = 0;
  let yesterday_seconds = 0;
  let week_seconds = 0;
  const todayCatMap: Record<string, number> = {};

  for (const s of sessions) {
    const st = new Date(s.start_time);
    const dur = s.duration_seconds;

    if (st >= startOfWeek) week_seconds += dur;
    if (st >= startOfToday) {
      today_seconds += dur;
      todayCatMap[s.category] = (todayCatMap[s.category] ?? 0) + dur;
    } else if (st >= startOfYesterday && st < startOfToday) {
      yesterday_seconds += dur;
    }
  }

  const todayTotal = today_seconds || 1;
  const today_by_category: CategoryAgg[] = CATEGORIES.map((c) => {
    const total = todayCatMap[c] ?? 0;
    return {
      category: c,
      total_seconds: total,
      percentage: (total / todayTotal) * 100,
      count: sessions.filter((s) => s.category === c && new Date(s.start_time) >= startOfToday).length,
    };
  }).filter((c) => c.total_seconds > 0);

  if (today_by_category.length === 0 && today_seconds === 0) {
    // return empty
  }

  return { today_seconds, yesterday_seconds, week_seconds, today_by_category };
}

export async function fetchCategoryAggregates(): Promise<CategoryAgg[]> {
  const sessions = await fetchAllSessions();
  const catMap: Record<string, number> = {};
  let total = 0;
  for (const s of sessions) {
    catMap[s.category] = (catMap[s.category] ?? 0) + s.duration_seconds;
    total += s.duration_seconds;
  }
  const safeTotal = total || 1;
  return CATEGORIES.map((c) => ({
    category: c,
    total_seconds: catMap[c] ?? 0,
    percentage: ((catMap[c] ?? 0) / safeTotal) * 100,
    count: sessions.filter((s) => s.category === c).length,
  })).filter((c) => c.total_seconds > 0);
}

export async function fetchHistory(filters?: {
  category?: Category | 'all';
  activity?: string;
  date?: string;
  search?: string;
}): Promise<HistoryItem[]> {
  const sessions = await fetchAllSessions();
  let items: HistoryItem[] = sessions.map((s) => ({
    id: s.id,
    activity_name: s.activity_name,
    category: s.category,
    start_time: s.start_time,
    end_time: s.end_time,
    duration_seconds: s.duration_seconds,
    date: new Date(s.start_time).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
  }));

  if (filters?.category && filters.category !== 'all') {
    items = items.filter((i) => i.category === filters.category);
  }
  if (filters?.activity && filters.activity !== 'all') {
    items = items.filter((i) => i.activity_name === filters.activity);
  }
  if (filters?.date) {
    items = items.filter((i) => {
      const d = new Date(i.start_time);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return dStr === filters.date;
    });
  }
  if (filters?.search && filters.search.trim()) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (i) =>
        i.activity_name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q),
    );
  }

  return items;
}

/* ---------- Health ---------- */

export async function checkHealth(): Promise<boolean> {
  try {
    const { error } = await supabase.from('activities').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

/* ---------- Utilities ---------- */

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatHumanDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return `${Math.floor(seconds)}s`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
