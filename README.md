# Success Squad — README

## Overview
Full 1:1 React 18 + Vite port of the Success Squad static site. All 7 pages share a single Navbar/Footer via a Layout route.

## Install & Run

```
cd success-squad-react
npm install
npm run dev
```

Dev server: http://localhost:5173

## Build for Production

```
npm run build
```

Output in `dist/`

## Project Structure

```
src/
  main.jsx             — entry, imports style.css once
  App.jsx              — BrowserRouter + Routes
  styles/style.css     — global CSS
  components/layout/   — Navbar, Footer, Layout
  components/events/   — EFestHero, RegistrationModal, steps/
  components/gallery/  — GalleryCarousel, MemoriesSection
  pages/               — Home, About, Team, Events, Gallery, Startups, Contact,
                         RegistrationHub, StatusLookup, AdminDashboard, NotFound
  services/
    supabase.js        — Supabase client (URL + anon key from env)
    registrations.js   — All DB/Edge Function/Storage operations
  data/                — navData, homeData, teamData, eventConfigs, ...
public/
  images/              — team photos
supabase/
  migrations/          — 001_init.sql (schema, RLS, trigger, pg_cron)
  functions/           — create-payment-order, razorpay-webhook, expire-order
```

---

## Supabase Backend — Full Deployment Walkthrough

The E-Fest registration system uses **Supabase** (Postgres + Edge Functions + Realtime + Storage)
and **Razorpay** for gateway-verified UPI payments.

> **Why Supabase instead of Firebase?**
> Firebase Cloud Functions require the Blaze pay-as-you-go billing plan just to make outbound HTTP
> calls to Razorpay. Supabase Edge Functions work on the free tier with zero restrictions.

### 1. Create a Supabase project
Go to https://supabase.com → New Project → pick region `ap-south-1` (Mumbai) for India.

### 2. Copy credentials into `.env.local`
From Supabase Dashboard → Project Settings → API:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```
Also add these to Vercel → Project Settings → Environment Variables.

### 3. Install Supabase CLI and link project
```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```
*(Find the project ref in Project Settings → General → Reference ID)*

### 4. Run the database migration
```bash
supabase db push
```
Creates: `pending_payments`, `registrations`, `team_id_counters` tables, RLS policies,
the `handle_payment_confirmed` DB trigger (auto-creates registration row when payment confirmed),
pg_cron sweep job (marks expired orders every minute), and Realtime publication.

### 5. Create Storage bucket
Dashboard → Storage → New Bucket → name: `payment-proofs` → Public: **OFF**.

### 6. Set secrets (NEVER in .env files)
```bash
supabase secrets set RAZORPAY_KEY_ID=rzp_test_TiN11aokzHSqdi
supabase secrets set RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET
supabase secrets set RAZORPAY_WEBHOOK_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

### 7. Deploy Edge Functions
```bash
supabase functions deploy create-payment-order
supabase functions deploy razorpay-webhook
supabase functions deploy expire-order
```
Webhook URL will be: `https://YOUR_REF.supabase.co/functions/v1/razorpay-webhook`

### 8. Register webhook in Razorpay Dashboard
Dashboard → Settings → Webhooks → Add New Webhook:
- URL: the `razorpay-webhook` function URL from step 7
- Secret: same string as `RAZORPAY_WEBHOOK_SECRET`
- Events: `payment.captured`, `payment.authorized`, `payment.failed`

### 9. Set up admin user
Dashboard → Authentication → Users → Invite user → enter admin email.
Add the same email to `ADMIN_EMAILS` in `src/pages/AdminDashboard.jsx`.

### 10. Going Live with Razorpay
Complete Razorpay KYC → get Live keys → `supabase secrets set` with Live keys → register new Live webhook in the Razorpay Live Dashboard.

### Supabase Free Tier Limits
| Resource | Free Limit | Expected at Event Scale |
|---|---|---|
| Edge Function invocations | 500K/month | ~3 per registration |
| Realtime connections | 200 concurrent | Fine |
| Database | 500 MB | ~1 MB per 1,000 teams |
| Storage | 1 GB | Fine for screenshots |
