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
| `NEXT_PUBLIC_APP_URL` | `https://www.getgroomerflow.com` | `https://www.getgroomerflow.com` |
| `NEXTAUTH_URL` | `http://localhost:3000` | `https://www.getgroomerflow.com` (Vercel env) |

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

## Production enhancements (email, reminders, Google)

### Resend (confirmation + day-before emails)

1. Create an API key at [resend.com](https://resend.com).
2. Verify domain `getgroomerflow.com` (or use Resend sandbox while testing).
3. Add to **Vercel → Environment Variables** (and `.env.local` for local tests):
   - `RESEND_API_KEY=re_...`
   - `EMAIL_FROM=GetGroomerFlow <bookings@getgroomerflow.com>` (must match a verified sender)

Without `RESEND_API_KEY`, dev logs `[email:dev]` to the terminal; production marks emails as `failed` in `reminder_logs` but bookings still succeed.

### Vercel Cron (day-before reminders)

`vercel.json` runs `/api/cron/reminders` daily at **15:00 UTC**.

1. Generate a secret: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
2. Add **`CRON_SECRET`** to Vercel env (Production + Preview).
3. Redeploy. Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically.

Manual test:

```powershell
curl.exe -H "Authorization: Bearer YOUR_CRON_SECRET" https://www.getgroomerflow.com/api/cron/reminders
```

### Google sign-in (groomers, optional)

1. [Google Cloud Console](https://console.cloud.google.com/) → OAuth client (Web).
2. Redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://www.getgroomerflow.com/api/auth/callback/google`
3. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to Vercel + `.env.local`, then Redeploy.
4. Login/Register show **Continue with Google** when both vars are set.

## License

MIT (see plan in `docs/`).
