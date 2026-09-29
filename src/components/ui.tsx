export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-stone-200/80 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-3 border-stone-200 border-t-teal-600 rounded-full animate-spin" />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  message,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-300 mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-stone-700">{title}</h3>
      <p className="text-sm text-stone-400 mt-1 max-w-xs">{message}</p>
    </div>
  );
}
