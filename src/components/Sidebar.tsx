import { Clock, LayoutDashboard, Activity, History, BarChart3, Settings } from 'lucide-react';

export type Page = 'dashboard' | 'activities' | 'history' | 'analytics' | 'settings';

interface NavItem {
  id: Page;
  label: string;
  icon: typeof Clock;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'activities', label: 'Activities', icon: Activity },
  { id: 'history', label: 'History', icon: History },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  current: Page;
  onNavigate: (page: Page) => void;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ current, onNavigate, open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-stone-900/30 backdrop-blur-sm z-30 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-stone-200 flex flex-col z-40 transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="px-6 py-7 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center shadow-sm">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-stone-800 tracking-tight">Time Tracker</h1>
              <p className="text-[11px] text-stone-400 font-medium">Productivity Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = current === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] ${active ? 'text-teal-600' : 'text-stone-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-6 py-4 border-t border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-xs font-semibold">
              A
            </div>
            <div>
              <p className="text-sm font-medium text-stone-700">Apurva</p>
              <p className="text-[11px] text-stone-400">Demo User</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
