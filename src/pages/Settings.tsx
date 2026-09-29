import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Database, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import { checkHealth } from '@/lib/api';

export function Settings() {
  const { toast } = useToast();
  const [health, setHealth] = useState<boolean | null>(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    checkHealth().then(setHealth);
  }, []);

  const handleClearSessions = async () => {
    if (!confirm('Delete ALL tracked sessions? This cannot be undone. Activities will be kept.')) return;
    setClearing(true);
    try {
      const { error } = await supabase.from('sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      toast('All sessions cleared', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to clear sessions', 'error');
    } finally {
      setClearing(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Delete ALL data (activities, sessions, active timer)? This cannot be undone.')) return;
    setClearing(true);
    try {
      await Promise.all([
        supabase.from('active_timer').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('activities').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      ]);
      toast('All data cleared', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to clear data', 'error');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800 tracking-tight">Settings</h1>
        <p className="text-sm text-stone-400 mt-0.5">Manage your Time Tracker data</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
            <Database className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-stone-700">Database Status</h3>
            <p className="text-sm text-stone-400">Connection to the cloud database</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {health === null ? (
            <span className="text-sm text-stone-400">Checking...</span>
          ) : health ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Connected & operational</span>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 text-rose-600" />
              <span className="text-sm font-medium text-rose-700">Connection issue</span>
            </>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-stone-700">User Profile</h3>
            <p className="text-sm text-stone-400">Demo user information</p>
          </div>
        </div>
        <div className="flex items-center gap-3 py-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-sm font-semibold">
            A
          </div>
          <div>
            <p className="text-sm font-medium text-stone-700">Apurva</p>
            <p className="text-xs text-stone-400">Demo user — no authentication required</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-l-4 border-l-rose-400">
        <h3 className="text-base font-semibold text-stone-700 mb-1">Danger Zone</h3>
        <p className="text-sm text-stone-400 mb-4">These actions permanently delete data and cannot be undone.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleClearSessions}
            disabled={clearing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 text-sm font-medium hover:bg-rose-50 disabled:opacity-50 transition-all"
          >
            <Trash2 className="w-4 h-4" /> Clear All Sessions
          </button>
          <button
            onClick={handleClearAll}
            disabled={clearing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 disabled:opacity-50 transition-all"
          >
            <Trash2 className="w-4 h-4" /> Clear Everything
          </button>
        </div>
      </Card>
    </div>
  );
}
