# Time Tracker

A polished, modern SaaS-style time tracking application. Track activities by category, run live timers, view daily totals, browse history, and visualize your time with analytics charts.

## Features

1. **Add Activity** — Create activities with name, category, and description
2. **Start/Stop Timer** — Live HH:MM:SS timer that survives browser refresh
3. **Category-wise Tracking** — Development, Design, Study, Meeting, Research, Other
4. **Daily Total** — Today, yesterday, and this week totals
5. **Time Usage History** — Filterable table with date, category, activity, and search

## Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Charts:** Recharts
- **Database:** Supabase (PostgreSQL) — cloud-hosted, no local setup needed

## Getting Started

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
  components/    UI components (Sidebar, TopBar, Toast, etc.)
  lib/           Supabase client + API functions
  pages/         Dashboard, Activities, History, Analytics, Settings
  types.ts       Shared TypeScript types
  App.tsx        Main app with routing
```

## Categories

- Development
- Design
- Study
- Meeting
- Research
- Other

## Database Schema

- **activities** — stored activity definitions (name, category, description)
- **sessions** — completed time tracking sessions (start, end, duration)
- **active_timer** — the single currently-running timer (survives refresh)

## Demo User

The app uses a simple demo user "Apurva" — no authentication required.
