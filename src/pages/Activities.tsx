import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Activity as ActivityIcon, Search } from 'lucide-react';
import { Card, EmptyState, PageLoader } from '@/components/ui';
import { CategoryBadge } from '@/components/CategoryBadge';
import { useToast } from '@/components/Toast';
import { fetchActivities, createActivity, deleteActivity } from '@/lib/api';
import { CATEGORIES } from '@/types';
import type { Activity, Category } from '@/types';

export function Activities() {
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Development');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await fetchActivities();
      setActivities(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load activities', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast('Activity name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const created = await createActivity({ name, category, description });
      setActivities((prev) => [created, ...prev]);
      setName('');
      setDescription('');
      setCategory('Development');
      setShowForm(false);
      toast(`Activity "${created.name}" created`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to create activity', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, actName: string) => {
    try {
      await deleteActivity(id);
      setActivities((prev) => prev.filter((a) => a.id !== id));
      toast(`Deleted "${actName}"`, 'info');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete', 'error');
    }
  };

  const filtered = activities.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800 tracking-tight">Activities</h1>
          <p className="text-sm text-stone-400 mt-0.5">Create and manage your tracked activities</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Activity
        </button>
      </div>

      {showForm && (
        <Card className="p-6 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1.5">Activity Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Build landing page"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes about this activity..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-all shadow-sm"
              >
                {saving ? 'Saving...' : 'Save Activity'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-500 text-sm font-medium hover:bg-stone-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <PageLoader />
      ) : activities.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ActivityIcon className="w-6 h-6" />}
            title="No activities yet"
            message="Click 'Add Activity' to create your first tracked activity."
          />
        </Card>
      ) : (
        <>
          <div className="relative max-w-xs">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activities..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((a) => (
              <Card key={a.id} className="p-5 group hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-stone-800 truncate">{a.name}</h3>
                    <div className="mt-2">
                      <CategoryBadge category={a.category} />
                    </div>
                    {a.description && (
                      <p className="text-sm text-stone-400 mt-3 line-clamp-2">{a.description}</p>
                    )}
                    <p className="text-xs text-stone-300 mt-3">
                      Added {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(a.id, a.name)}
                    className="text-stone-300 hover:text-rose-500 transition-colors p-1"
                    aria-label="Delete activity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {filtered.length === 0 && (
            <Card>
              <EmptyState
                icon={<Search className="w-6 h-6" />}
                title="No matches"
                message="Try a different search term."
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
