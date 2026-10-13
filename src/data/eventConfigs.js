/**
 * src/data/eventConfigs.js
 *
 * Single source of truth for all E-Fest '26 event registration configs.
 *
 * registrationType options:
 *   'team'             — standard team registration + UPI payment (default)
 *   'individual'       — individual registration (no team name), UPI payment
 *   'external-unstop'  — redirects to Unstop; no internal payment flow
 *
 * QR CODE STATUS (per event):
 *  ✅ bgmi-lec       — qrCodeImage set
 *  ⚠️  fflec          — add /images/fflec-upi-qr.png
 *  ✅ craftcode       — external Unstop link, no QR needed
 *  ⚠️  ipl-auction    — add /images/ipl-upi-qr.png
 *  ⚠️  startup-pitch  — add /images/pitch-upi-qr.png
 *  ⚠️  money-makers   — add /images/money-upi-qr.png
 */

export const eventConfigs = {
  'bgmi-lec': {
    id:           'bgmi-lec',
    name:         'BGMI LEC',
    tagline:      'Dominate the battleground. Squad up and compete.',
    teamSize:     4,
    entryFee:     229,        // ₹ per team
    upiId:        '9404337568@upi',
    qrCodeImage:  '/images/bgmi-upi-qr.png',
    comingSoon:   false,
    registrationType: 'team',
    fields: {
      leader: ['name', 'phone', 'email'],
      members: 3,
    },
  },

  'fflec': {
    id:           'fflec',
    name:         'FFLEC',
    tagline:      'Free Fire squad battles. Prove your squad is elite.',
    teamSize:     4,
    entryFee:     249,
    upiId:        '9404337568@upi',
    qrCodeImage:  '/images/fflec-upi-qr.png',
    comingSoon:   false,
    registrationType: 'team',
    fields: {
      leader: ['name', 'phone', 'email'],
      members: 3,
    },
  },

  // ── CraftCode (external Unstop event) ────────────────────────────────────────
  // Clicking "Register Now" opens a simple modal with the Unstop link.
  // No internal payment or team-details form needed.
  'craftcode': {
    id:                'craftcode',
    name:              'CraftCode',
    tagline:           'Ship something real in 24 hours. No excuses.',
    teamSize:          4,
    entryFee:          499,   // fee on Unstop platform
    registrationType:  'external-unstop',
    unstopUrl:         'https://unstop.com/competitions/craftcode-e-fest-26', // ⚠️ Replace with real URL
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
    entryFee:     299,
    upiId:        '9404337568@upi',
    qrCodeImage:  '/images/ipl-upi-qr.png',
    comingSoon:   false,
    registrationType: 'team',
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
    entryFee:     299,
    upiId:        '9404337568@upi',
    qrCodeImage:  '/images/pitch-upi-qr.png',
    comingSoon:   false,
    registrationType: 'team',
    fields: {
      leader: ['name', 'phone', 'email'],
      members: 3,
    },
  },

  // ── Illuminate Workshop — individual registration, no team ────────────────
  'money-makers': {
    id:               'money-makers',
    name:             'Illuminate Workshop',
    tagline:          'Learn, build and get inspired. Hands-on workshop with industry experts.',
    teamSize:         1,      // individual only
    entryFee:         749,    // ₹ per individual
    upiId:            '9404337568@upi',
    qrCodeImage:      '/images/money-upi-qr.png',
    comingSoon:       false,
    registrationType: 'individual', // renders individual form, not team form
    fields: {
      individual: ['name', 'phone', 'college', 'address', 'year', 'department'],
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
