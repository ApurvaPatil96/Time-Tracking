import { useState, useEffect, useCallback, useMemo } from 'react';
import { History as HistoryIcon, Search, Filter } from 'lucide-react';
import { Card, EmptyState, PageLoader } from '@/components/ui';
import { CategoryBadge } from '@/components/CategoryBadge';
import { useToast } from '@/components/Toast';
import { fetchHistory, fetchAllSessions, formatTime, formatDate, formatHumanDuration } from '@/lib/api';
import { CATEGORIES } from '@/types';
import type { HistoryItem, Category, Session } from '@/types';

export function History() {
  const { toast } = useToast();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const load = useCallback(async () => {
    try {
      const [hist, sess] = await Promise.all([fetchHistory(), fetchAllSessions()]);
      setItems(hist);
      setSessions(sess);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load history', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const activityNames = useMemo(() => {
    const set = new Set(sessions.map((s) => s.activity_name));
    return Array.from(set).sort();
  }, [sessions]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (categoryFilter !== 'all' && i.category !== categoryFilter) return false;
      if (activityFilter !== 'all' && i.activity_name !== activityFilter) return false;
      if (dateFilter) {
        const d = new Date(i.start_time);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (dStr !== dateFilter) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!i.activity_name.toLowerCase().includes(q) && !i.category.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [items, categoryFilter, activityFilter, dateFilter, search]);

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setActivityFilter('all');
    setDateFilter('');
  };

  const hasFilters = search || categoryFilter !== 'all' || activityFilter !== 'all' || dateFilter;

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800 tracking-tight">History</h1>
        <p className="text-sm text-stone-400 mt-0.5">All your tracked time sessions</p>
      </div>

      {/* Filters */}
      <Card className="p-4 md:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-stone-400" />
          <span className="text-sm font-medium text-stone-600">Filters</span>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activity or category..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as Category | 'all')}
            className="px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
          >
            <option value="all">All Activities</option>
            {activityNames.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
          />
        </div>
      </Card>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<HistoryIcon className="w-6 h-6" />}
            title={hasFilters ? 'No matching sessions' : 'No sessions yet'}
            message={hasFilters ? 'Try adjusting your filters.' : 'Complete a timer to see your history here.'}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  <th className="text-left text-xs font-semibold text-stone-400 uppercase tracking-wider px-5 py-3">Activity</th>
                  <th className="text-left text-xs font-semibold text-stone-400 uppercase tracking-wider px-5 py-3">Category</th>
                  <th className="text-left text-xs font-semibold text-stone-400 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Start</th>
                  <th className="text-left text-xs font-semibold text-stone-400 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">End</th>
                  <th className="text-left text-xs font-semibold text-stone-400 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Date</th>
                  <th className="text-right text-xs font-semibold text-stone-400 uppercase tracking-wider px-5 py-3">Duration</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <tr
                    key={item.id}
                    className={`border-b border-stone-50 hover:bg-stone-50/50 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-stone-700">{item.activity_name}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <CategoryBadge category={item.category} />
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <p className="text-sm text-stone-500 font-mono">{formatTime(item.start_time)}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <p className="text-sm text-stone-500 font-mono">{formatTime(item.end_time)}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <p className="text-sm text-stone-500">{formatDate(item.start_time)}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <p className="text-sm font-mono font-medium text-stone-700">{formatHumanDuration(item.duration_seconds)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-stone-100 bg-stone-50/30">
            <p className="text-xs text-stone-400">
              {filtered.length} session{filtered.length !== 1 ? 's' : ''}
              {filtered.length > 0 && (
                <> · Total: {formatHumanDuration(filtered.reduce((sum, i) => sum + i.duration_seconds, 0))}</>
              )}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
