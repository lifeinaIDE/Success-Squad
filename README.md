# Success Squad React — Migration README

## Overview
Full 1:1 React 18 + Vite port of the Success Squad static site. All 7 pages share a single Navbar/Footer via a Layout route.

## Install & Run

`
cd success-squad-react
npm install
npm run dev
`

Dev server: http://localhost:5173/Success-Squad/

## Build for Production

`
npm run build
`

Output in dist/

## Deploy to GitHub Pages

1. Install: 
pm install --save-dev gh-pages
2. Add to package.json scripts:
   - "predeploy": "npm run build"
   - "deploy": "gh-pages -d dist"
3. vite.config.js already has: base: '/Success-Squad---EDC-/'
4. Add public/404.html for SPA routing — it redirects unknown URLs to index.html via query string so React Router can handle the path.
5. Run: 
pm run deploy

## Project Structure

src/
  main.jsx           — entry, imports style.css once
  App.jsx            — BrowserRouter + Routes
  styles/style.css   — global CSS (identical to original)
  components/layout/ — Navbar, Footer, Layout
  components/ui/     — FeaturedTeamCard, TeamCard, AlumniCard, PillarCard, EventCard, StartupCard, ValueItem
  components/gallery/ — GalleryCarousel, MemoriesSection
  pages/             — Home, About, Team, Events, Gallery, Startups, Contact, NotFound
  hooks/             — useScrolled, useCounter, useScrollReveal, useLightbox, useDocumentTitle
  data/              — navData, homeData, valuesData, teamData, eventsData, galleryData, startupsData
public/
  images/            — team photos
  Success Squad.jpg  — logo

## Razorpay Payment Gateway & Cloud Functions Setup

The E-Fest registration system uses Razorpay for verified UPI payments, backed by Firebase Cloud Functions.

**1. Razorpay Account Setup**
- Sign up at Razorpay.com.
- Use **Test Mode** for development (no KYC required).
- Go live by submitting standard business KYC (flag this early to the organizing team).
- In Test Mode, generate API keys: `rzp_test_...` and your secret.

**2. Firebase Cloud Functions (Blaze Plan Required)**
To make outbound network calls to Razorpay's API from Firebase Cloud Functions, your Firebase project **must** be on the Blaze (pay-as-you-go) plan.
- At hackathon-scale traffic, this will cost exactly $0.00 (within generous free tiers).
- The Blaze plan is merely a requirement to unlock outbound HTTP requests.

**3. Configure Environment Secrets**
Do **NOT** put Razorpay secrets in `.env.local`. They must be set in the Firebase Cloud Functions environment:
`firebase functions:config:set razorpay.id="YOUR_KEY_ID" razorpay.secret="YOUR_KEY_SECRET" razorpay.webhook_secret="YOUR_WEBHOOK_SECRET"`

**4. Razorpay Webhook Registration**
- In the Razorpay Dashboard → Settings → Webhooks.
- Add a new webhook URL pointing to your deployed `razorpayWebhook` Cloud Function.
- Events to check: `payment.captured`, `payment.failed`, `payment.authorized`.
- Secret: enter the exact same string you saved to `razorpay.webhook_secret` in step 3.

**5. Going Live**
- Once KYC is approved, switch Razorpay to Live Mode.
- Generate Live API keys.
- Update Firebase config with the Live keys and a new Live Webhook Secret.
- Update the webhook URL in the Razorpay Live Dashboard.
