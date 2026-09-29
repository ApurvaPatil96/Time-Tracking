import { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie as RePie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { BarChart3, Clock } from 'lucide-react';
import { Card, EmptyState, PageLoader } from '@/components/ui';
import { CATEGORY_COLORS } from '@/components/CategoryBadge';
import { useToast } from '@/components/Toast';
import { fetchCategoryAggregates, fetchAllSessions, formatHumanDuration } from '@/lib/api';
import type { CategoryAgg, Session } from '@/types';

export function Analytics() {
  const { toast } = useToast();
  const [aggregates, setAggregates] = useState<CategoryAgg[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [agg, sess] = await Promise.all([fetchCategoryAggregates(), fetchAllSessions()]);
      setAggregates(agg);
      setSessions(sess);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const totalSeconds = aggregates.reduce((sum, a) => sum + a.total_seconds, 0);
  const totalSessions = sessions.length;

  // last 7 days bar data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const secs = sessions
      .filter((s) => {
        const st = new Date(s.start_time);
        return st >= dayStart && st < dayEnd;
      })
      .reduce((sum, s) => sum + s.duration_seconds, 0);
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      seconds: secs,
      hours: Math.round((secs / 3600) * 100) / 100,
    };
  });

  if (loading) return <PageLoader />;

  if (aggregates.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800 tracking-tight">Analytics</h1>
          <p className="text-sm text-stone-400 mt-0.5">Visualize how you spend your time</p>
        </div>
        <Card>
          <EmptyState
            icon={<BarChart3 className="w-6 h-6" />}
            title="No data to analyze yet"
            message="Complete a few timer sessions to see your analytics charts."
          />
        </Card>
      </div>
    );
  }

  const pieData = aggregates.map((a) => ({
    name: a.category,
    value: a.total_seconds,
    percentage: a.percentage,
    color: CATEGORY_COLORS[a.category as keyof typeof CATEGORY_COLORS] ?? '#78716c',
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800 tracking-tight">Analytics</h1>
        <p className="text-sm text-stone-400 mt-0.5">Visualize how you spend your time</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">Total Tracked</p>
          <p className="text-2xl font-semibold text-teal-700 mt-1">{formatHumanDuration(totalSeconds)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">Total Sessions</p>
          <p className="text-2xl font-semibold text-stone-700 mt-1">{totalSessions}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">Categories Used</p>
          <p className="text-2xl font-semibold text-orange-600 mt-1">{aggregates.length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut chart */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-stone-700 mb-4">Time by Category</h3>
          <div className="relative" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <RePie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                  ))}
                </RePie>
                <Tooltip
                  formatter={((value: number, _name: string, props: { payload: { percentage: number; name: string } }) => {
                    const p = props.payload.percentage;
                    return [`${formatHumanDuration(value)} (${p.toFixed(1)}%)`, props.payload.name];
                  }) as never}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e7e5e4',
                    fontSize: '13px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-xs text-stone-400 font-medium">Total</p>
              <p className="text-xl font-semibold text-stone-700">{formatHumanDuration(totalSeconds)}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {aggregates
              .slice()
              .sort((a, b) => b.total_seconds - a.total_seconds)
              .map((a) => (
                <div key={a.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[a.category as keyof typeof CATEGORY_COLORS] ?? '#78716c' }}
                    />
                    <span className="text-sm text-stone-600">{a.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-stone-500">{formatHumanDuration(a.total_seconds)}</span>
                    <span className="text-xs text-stone-400 w-12 text-right">{a.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
          </div>
        </Card>

        {/* Last 7 days bar chart */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-stone-700 mb-4">Last 7 Days</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: '#a8a29e' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#a8a29e' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}h`}
                />
                <Tooltip
                  formatter={((value: number) => [`${formatHumanDuration(value * 3600)}`, 'Tracked']) as never}
                  labelFormatter={((label: string, payload: readonly { payload: { date?: string } }[]) => {
                    const item = payload?.[0]?.payload;
                    return item?.date ?? label;
                  }) as never}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e7e5e4',
                    fontSize: '13px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                  cursor={{ fill: '#f5f5f4' }}
                />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]} fill="#0d9488" barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-stone-400">
            <Clock className="w-4 h-4" />
            <span>
              Week total: {formatHumanDuration(last7Days.reduce((sum, d) => sum + d.seconds, 0))}
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
