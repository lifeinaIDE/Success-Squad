/**
 * src/data/eventConfigs.js
 *
 * Single source of truth for all E-Fest '26 event registration configs.
 *
 * To enable a future event:
 *  1. Set comingSoon: false
 *  2. Fill in all fields (teamSize, entryFee, upiId, qrCodeImage, fields)
 *  3. No other code changes needed — RegistrationModal reads this config.
 *
 * QR CODE STATUS (per event):
 *  ✅ bgmi-lec        — qrCodeImage set (/images/bgmi-upi-qr.png) — fill with real file
 *  ⚠️  fflec          — qrCodeImage NOT set — add /images/fflec-upi-qr.png
 *  ✅ craftcode        — registrationType: 'external-unstop'; no payment QR needed
 *  ⚠️  ipl-auction    — qrCodeImage NOT set — add /images/ipl-upi-qr.png
 *  ⚠️  startup-pitch  — qrCodeImage NOT set — add /images/pitch-upi-qr.png
 *  ⚠️  money-makers   — qrCodeImage NOT set — add /images/money-upi-qr.png
 *
 * NOTE: Any event missing a qrCodeImage will fall back to the BGMI QR as a
 * placeholder; replace by adding the correct file to /public/images/.
 */

export const eventConfigs = {
  'bgmi-lec': {
    id:           'bgmi-lec',
    name:         'BGMI LEC',
    tagline:      'Dominate the battleground. Squad up and compete.',
    teamSize:     4,          // 1 leader + 3 members
    entryFee:     199,        // ₹ per team
    upiId:        '9404337568@upi',
    qrCodeImage:  '/images/bgmi-upi-qr.png', // ⚠️ Replace with real QR image
    comingSoon:   false,
    fields: {
      leader: ['name', 'phone', 'email'],
      members: 3, // member 2, 3, 4 — each has name + email (optional)
    },
  },

  'fflec': {
    id:           'fflec',
    name:         'FFLEC',
    tagline:      'Free Fire squad battles. Prove your squad is elite.',
    teamSize:     4,
    entryFee:     149,
    upiId:        '9404337568@upi',
    qrCodeImage:  '/images/fflec-upi-qr.png', // ⚠️ Add this file to /public/images/
    comingSoon:   false,
    fields: {
      leader: ['name', 'phone', 'email'],
      members: 3,
    },
  },

  // ── CraftCode (formerly "24-Hour Hackathon") ─────────────────────────────────
  // registrationType: 'external-unstop' means this event does NOT use the
  // standard internal payment flow. RegistrationModal branches on this field.
  // Unstop handles all payment/registration externally; Success Squad issues a
  // receipt only after admin verifies the Unstop registration ID + screenshot.
  //
  // TODO (confirm with team): Does CraftCode collect a separate Success Squad fee?
  //   - DEFAULT ASSUMPTION: NO — Unstop handles all payment.
  //     If a separate fee IS collected, set hasSeparateFee: true and add upiId/
  //     qrCodeImage here — PaymentStep will be shown inside Section B after unlock.
  // ─────────────────────────────────────────────────────────────────────────────
  'craftcode': {
    id:                'craftcode',
    name:              'CraftCode',
    tagline:           'Ship something real in 24 hours. No excuses.',
    teamSize:          4,
    entryFee:          299,   // Fee charged on Unstop — not collected by Success Squad
    registrationType:  'external-unstop',
    unstopUrl:         'https://unstop.com/competitions/craftcode-e-fest-26', // ⚠️ Replace with real Unstop URL
    hasSeparateFee:    false, // See TODO above — change to true if SS collects a fee
    comingSoon:        false,
    fields: {
      leader: ['name', 'phone', 'email'],
      members: 3,
    },
  },

  'ipl-auction': {
    id:           'ipl-auction',
    name:         'IPL Auction',
    tagline:      'Build your dream team. Strategy meets madness.',
    teamSize:     4,
    entryFee:     99,
    upiId:        '9404337568@upi',
    qrCodeImage:  '/images/ipl-upi-qr.png', // ⚠️ Add this file to /public/images/
    comingSoon:   false,
    fields: {
      leader: ['name', 'phone', 'email'],
      members: 3,
    },
  },

  'startup-pitch': {
    id:           'startup-pitch',
    name:         'Startup Pitch Battle',
    tagline:      'Pitch your idea. Win mentorship, funding access & glory.',
    teamSize:     4,
    entryFee:     49,
    upiId:        '9404337568@upi',
    qrCodeImage:  '/images/pitch-upi-qr.png', // ⚠️ Add this file to /public/images/
    comingSoon:   false,
    fields: {
      leader: ['name', 'phone', 'email'],
      members: 3,
    },
  },

  'money-makers': {
    id:           'money-makers',
    name:         'Money Makers',
    tagline:      'Trade, invest, and multiply your virtual portfolio.',
    teamSize:     4,
    entryFee:     249,
    upiId:        '9404337568@upi',
    qrCodeImage:  '/images/money-upi-qr.png', // ⚠️ Add this file to /public/images/
    comingSoon:   false,
    fields: {
      leader: ['name', 'phone', 'email'],
      members: 3,
    },
  },
}

// Ordered list for rendering the hub grid
export const efestEvents = [
  eventConfigs['bgmi-lec'],
  eventConfigs['fflec'],
  eventConfigs['craftcode'],
  eventConfigs['ipl-auction'],
  eventConfigs['startup-pitch'],
  eventConfigs['money-makers'],
]
