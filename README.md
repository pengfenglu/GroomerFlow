# GetGroomerFlow

Simple booking and client records for **independent pet groomers** (US / UK / CA / AU).

**Product site (planned):** [getgroomerflow.com](https://getgroomerflow.com)

- **Stack**: Next.js (App Router) · TypeScript · Tailwind · Supabase · NextAuth
- **Docs**: [`docs/GroomerFlow方案.md`](docs/GroomerFlow方案.md) · [`docs/GroomerFlow风格方案.md`](docs/GroomerFlow风格方案.md)

## Local setup

### 1. Environment

```powershell
cd d:\cursor\GroomerFlow
copy .env.example .env.local
```

Set URLs (already in `.env.production` for deploy):

| Variable | Local dev (`.env.local`) | Production |
|----------|--------------------------|------------|
| `NEXT_PUBLIC_APP_URL` | `https://getgroomerflow.com` | same |
| `NEXTAUTH_URL` | `http://localhost:3000` | `https://getgroomerflow.com` (`.env.production`) |

Fill in Supabase URL/keys and generate a secret:

```powershell
# Example: paste output into AUTH_SECRET in .env.local
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Supabase database

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the migration file:
   `supabase/migrations/20260527120000_initial_schema.sql`
3. Enable **Email** auth provider under Authentication → Providers (for email/password sign-in).

### 3. Install & run

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → register → complete onboarding → share `/book/your-slug`.

### 4. Verify

```powershell
npm run lint
npm run build
```

## Key routes

| Path | Purpose |
|------|---------|
| `/register` | Groomer sign-up |
| `/dashboard` | Today’s appointments |
| `/book/[slug]` | Public booking (no login) |
| `POST /api/book` | Public booking API (service role) |

## Email (optional)

Set `RESEND_API_KEY` in `.env.local`. Without it, dev mode logs email bodies to the server console.

## Cron (24h reminders)

`GET /api/cron/reminders` with header `Authorization: Bearer <CRON_SECRET>` — configure on Vercel Cron after deploy.

## License

MIT (see plan in `docs/`).
