import type { Category } from '@/types';

export const CATEGORY_COLORS: Record<Category, string> = {
  Development: '#0d9488',
  Design: '#f97316',
  Study: '#3b82f6',
  Meeting: '#a855f7',
  Research: '#eab308',
  Other: '#78716c',
};

export const CATEGORY_BG: Record<Category, string> = {
  Development: 'bg-teal-50 text-teal-700 border-teal-200',
  Design: 'bg-orange-50 text-orange-700 border-orange-200',
  Study: 'bg-blue-50 text-blue-700 border-blue-200',
  Meeting: 'bg-purple-50 text-purple-700 border-purple-200',
  Research: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Other: 'bg-stone-100 text-stone-600 border-stone-200',
};

export function CategoryBadge({ category, className = '' }: { category: Category; className?: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_BG[category]} ${className}`}
    >
      {category}
    </span>
  );
}
