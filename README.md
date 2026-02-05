# SaansSync - Respiratory Monitoring Platform

A comprehensive respiratory health monitoring platform with separate frontend and backend services.

## 🏗️ Project Structure

```
saanssync/
├── frontend/                 ← Deploy THIS to Vercel
│   ├── src/
│   │   ├── app/              ← Next.js App Router
│   │   │   ├── page.tsx
│   │   │   ├── dashboard/
│   │   │   ├── patient/
│   │   │   └── api/          ← ONLY lightweight API routes
│   │   │
│   │   ├── components/
│   │   ├── lib/
│   │   │   └── supabase.ts
│   │   └── styles/
│   │
│   ├── public/
│   ├── .env.local            ← Vercel env vars
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── package-lock.json
│
├── backend/                  ← NOT deployed to Vercel
│   ├── src/
│   │   ├── server.ts
│   │   ├── middleware/
│   │   └── routes/
│   │
│   ├── tests/
│   │   ├── test-daily-logs.js
│   │   ├── test-complete-flow.js
│   │   └── test-bidirectional-flow.js
│   │
│   ├── sql/
│   │   ├── schema.sql
│   │   └── DISABLE_RLS.sql
│   │
│   ├── tsconfig.json
│   └── package.json
│
├── README.md
└── .gitignore
```

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repo to Vercel
2. Set these settings:
   - **Root Directory**: `frontend`
   - **Framework**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

3. Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=/api
   BACKEND_URL=https://your-backend.example.com
   ```

### Backend (Optional - for heavy processing)
- Deploy to Railway, Render, or similar
- Or keep as local development/testing environment

## 🐳 Local Development (Docker)

We recommend using Docker for a consistent development environment.

```bash
# Start both frontend and backend
docker-compose up --build
```

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001

## 🧪 Testing

We use **Vitest** for robust backend testing.

```bash
cd backend
npm test
```

Legacy manual test scripts are still available via `npm run test:legacy:all`.

## 🔒 Security & Best Practices

- **Security:** Backend now includes `helmet` for security headers.
- **Validation:** `zod` is installed for schema validation.
- **CI/CD:** GitHub Actions pipeline (`.github/workflows/ci.yml`) is set up for automated testing and linting.
- **Documentation:** See `CONTRIBUTING.md` for detailed dev guidelines.

## 📁 What Changed

✅ **Moved to backend/**:
- All test files (`test-*.js`)
- SQL files (`schema.sql`, `DISABLE_RLS.sql`)

✅ **Frontend now contains only**:
- UI components
- Next.js pages
- Lightweight API routes
- Supabase client calls

✅ **Clean separation**:
- Frontend = Vercel deployment
- Backend = Logic + tests + SQL
- Supabase = Database + realtime

This structure ensures Vercel deployment will succeed without any build failures from extra JS files or backend logic.

## Features

- **Patient Dashboard**: Real-time monitoring for multiple respiratory conditions
- **Doctor Portal**: Patient management and analytics
- **Alert System**: Intelligent health alerts based on patient data
- **Multi-language Support**: English and Arabic interfaces
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Deployment**: Vercel
- **UI Components**: Custom components with shadcn/ui

## Getting Started

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Backend Development
```bash
cd backend
npm install
npm run dev
```

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=/api
```

### Backend (.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
```

## Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `saanssync_schema.sql`
3. If needed, create a dev-only script to disable RLS for local testing
4. Update environment variables