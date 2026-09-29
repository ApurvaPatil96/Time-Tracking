export type Category = 'Development' | 'Design' | 'Study' | 'Meeting' | 'Research' | 'Other';

export const CATEGORIES: Category[] = [
  'Development',
  'Design',
  'Study',
  'Meeting',
  'Research',
  'Other',
];

export interface Activity {
  id: string;
  name: string;
  category: Category;
  description: string;
  created_at: string;
}

export interface Session {
  id: string;
  activity_id: string | null;
  activity_name: string;
  category: Category;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  created_at: string;
}

export interface ActiveTimer {
  id: string;
  activity_id: string | null;
  activity_name: string;
  category: Category;
  start_time: string;
  paused_at: string | null;
  paused_accumulated_seconds: number;
  is_paused: boolean;
  created_at: string;
}

export interface CategoryAgg {
  category: string;
  total_seconds: number;
  percentage: number;
  count: number;
}

export interface DailyStats {
  today_seconds: number;
  yesterday_seconds: number;
  week_seconds: number;
  today_by_category: CategoryAgg[];
}

export interface HistoryItem {
  id: string;
  activity_name: string;
  category: Category;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  date: string;
}
