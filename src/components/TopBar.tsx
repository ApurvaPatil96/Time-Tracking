import { Menu } from 'lucide-react';

interface TopBarProps {
  onMenuClick: () => void;
  title: string;
  subtitle?: string;
}

export function TopBar({ onMenuClick, title, subtitle }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 bg-[#FAF8F5]/80 backdrop-blur-md border-b border-stone-200/60">
      <div className="flex items-center gap-4 px-5 md:px-8 py-4">
        <button
          onClick={onMenuClick}
          className="md:hidden text-stone-500 hover:text-stone-700 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-semibold text-stone-800 tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-stone-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
}
