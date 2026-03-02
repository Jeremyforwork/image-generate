# Product Image Generator

电商平台产品图 AI 生成工具，基于火山引擎 Seedream 4.5 视觉大模型。

## Tech Stack

- Frontend: React + TypeScript + Tailwind CSS + Vite
- Backend: Vercel Serverless Functions (Express for local dev)
- Auth & DB: Supabase (Auth + PostgreSQL)
- Deployment: Vercel

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Enable Email auth in Authentication > Providers

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in:

```
SEEDREAM_API_KEY=your_volcengine_api_key
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Local Development

```bash
npm install
npm run dev:all    # Starts both Vite (3000) and API server (3001)
```

### 4. Deploy to Vercel

```bash
# Push to GitHub first, then:
# 1. Import repo in vercel.com
# 2. Add all env vars in Vercel project settings
# 3. Deploy
```

## Project Structure

```
├── api/              # Vercel serverless functions
│   ├── generate.ts   # Image generation endpoint
│   └── history.ts    # History CRUD endpoint
├── src/
│   ├── components/   # React components
│   ├── lib/          # Supabase client & API helpers
│   └── App.tsx       # Main app
├── server.ts         # Local dev Express server
├── supabase/
│   └── schema.sql    # Database schema
└── vercel.json       # Vercel config
```
