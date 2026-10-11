# Success Squad | README

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
  main.jsx, entry, imports style.css once
  App.jsx, BrowserRouter + Routes
  styles/style.css, global CSS
  components/layout/, Navbar, Footer, Layout
  components/events/, EFestHero, RegistrationModal, steps/
  components/gallery/, GalleryCarousel, MemoriesSection
  pages/, Home, About, Team, Events, Gallery, Startups, Contact,
                         RegistrationHub, StatusLookup, AdminDashboard, NotFound
  services/
    supabase.js, Supabase client (URL + anon key from env)
    registrations.js, All DB/Edge Function/Storage operations
  data/, navData, homeData, teamData, eventConfigs, ...
public/
  images/, team photos
supabase/
  migrations/, 001_init.sql (schema, RLS, trigger, pg_cron)
  functions/, create-payment-order, razorpay-webhook, expire-order
```

---

## Supabase Backend, Admin Workflow

The E-Fest registration system uses **Supabase** (Postgres + Storage) for data and a **Manual Admin Verification** process for payments.

### 1. The Registration Flow
- **Hold Slot**: User taps "Unlock Payment QR", which temporarily holds a slot for 5 minutes (`pending_payments` row).
- **Submit Proof**: User scans the static QR code, pays via UPI, and submits their **UTR (12-digit reference)** and a **screenshot**. The row is marked as `submitted`.
- **Verify**: An admin logs into the `/admin` dashboard, cross-references the UTR against the actual bank statement, and clicks "Mark Verified". This generates the official Team ID and finalizes the registration.

### 2. Admin Setup
1. Create a Supabase project at https://supabase.com
2. Copy credentials to `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
3. Run migrations via Supabase CLI: `npx supabase db push`
4. Set up Storage: Create a bucket named `payment-proofs`. Ensure **Public** is turned ON so screenshots render in the admin panel.
5. Set up Admin Users: In Supabase Dashboard → Authentication → Users, invite the admin email. Add this exact email to `ADMIN_EMAILS` in `src/pages/AdminDashboard.jsx`.

### 3. Expiry Sweep (Important)
To automatically release held slots where users didn't submit proof in time, enable `pg_cron` in Supabase (Database → Extensions → pg_cron), then run:
```sql
select cron.schedule('expire-stale-payments', '* * * * *',
  $$ update public.pending_payments set status = 'expired' where status = 'pending' and expires_at < now(); $$
);
```

### 4. Admin Best Practices
- **Duplicate UTRs**: The admin dashboard automatically flags UTRs that have been submitted multiple times. Always reject the duplicates.
- **Verification**: Only mark as verified once the money actually hits the bank account. A screenshot alone is easy to fake; the UTR is the source of truth.

---

## Template-Driven Receipt System

The platform generates official PDF receipts automatically upon verification using a designed template.

### Setup and Templates
1. **Buckets**: Ensure `receipt-templates` and `receipts` are created as **PRIVATE** buckets.
2. **Uploading Template**: Upload your blank receipt PDF design to the `receipt-templates` bucket named `default.pdf`.
3. **Coordinates config**: Map where the text prints by editing `supabase/functions/generate-receipt/template.config.json`. You can define `x`, `y`, `fontSize`, `color`, and `align`.

### Calibration Mode
To visually tune the text coordinates against your design:
1. Invoke the Edge Function manually with `{ "calibrate": true }`.
2. It returns a PDF with a red coordinate crosshair and the field keys injected as dummy text.
3. Adjust the JSON, run again, and repeat until perfect.

### Regenerating Receipts
- **Single receipt**: In the Admin Dashboard, click **Regenerate** on a specific row. This forces the Edge Function to overwrite the existing PDF.
- **Bulk Zip**: Use the **Download All Receipts (ZIP)** button in the dashboard.

### Offline / Emergency Batch Generation (Python)
If you ever need to generate receipts offline (e.g., for archival purposes or if the edge function fails), a Python script is provided in `tools/generate_receipts.py`.
1. Export the verified registrations from the dashboard to a CSV.
2. Run the script:
   ```bash
   cd tools
   pip install -r requirements.txt
   python generate_receipts.py registrations.csv ../path/to/template.pdf
   ```
3. It shares the exact same `template.config.json` coordinates as the Edge Function, ensuring consistency. Receipts will appear in `tools/output_receipts/`.

### Swapping a Final Template Checklist
- [ ] Upload the final `default.pdf` to the `receipt-templates` bucket.
- [ ] Invoke calibration mode.
- [ ] Tweak `x` and `y` values in `template.config.json` as necessary.
- [ ] Register a dummy team, verify them in the dashboard, and download the resulting receipt to confirm correctness.
