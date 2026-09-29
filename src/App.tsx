import { useState } from 'react';
import { Sidebar, type Page } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { ToastProvider } from '@/components/Toast';
import { Dashboard } from '@/pages/Dashboard';
import { Activities } from '@/pages/Activities';
import { History } from '@/pages/History';
import { Analytics } from '@/pages/Analytics';
import { Settings } from '@/pages/Settings';

const PAGE_TITLES: Record<Page, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Track your time in real time' },
  activities: { title: 'Activities', subtitle: 'Create and manage your tracked activities' },
  history: { title: 'History', subtitle: 'All your tracked time sessions' },
  analytics: { title: 'Analytics', subtitle: 'Visualize how you spend your time' },
  settings: { title: 'Settings', subtitle: 'Manage your Time Tracker data' },
};

function AppContent() {
  const [page, setPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const meta = PAGE_TITLES[page];

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex">
      <Sidebar
        current={page}
        onNavigate={setPage}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          title={meta.title}
          subtitle={meta.subtitle}
        />
        <main className="flex-1 px-5 md:px-8 py-6 max-w-6xl w-full mx-auto">
          {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
          {page === 'activities' && <Activities />}
          {page === 'history' && <History />}
          {page === 'analytics' && <Analytics />}
          {page === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
