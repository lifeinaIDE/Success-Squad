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
 * BGMI LEC is fully configured. All others are scaffolded as coming-soon.
 */

export const eventConfigs = {
  'bgmi-lec': {
    id:           'bgmi-lec',
    name:         'BGMI LEC',
    tagline:      'Dominate the battleground. Squad up and compete.',
    teamSize:     4,          // 1 leader + 3 members
    entryFee:     199,        // ₹ per team
    upiId:        '9404337568@upi',
    qrCodeImage:  '/images/bgmi-upi-qr.png', // add QR image to /public/images/
    comingSoon:   false,
    fields: {
      leader: ['name', 'phone', 'email'],
      members: 3, // member 2, 3, 4 — each has name + email
    },
  },

  'fflec': {
    id:           'fflec',
    name:         'FFLEC',
    tagline:      'Free Fire squad battles. Prove your squad is elite.',
    teamSize:     4,
    entryFee:     149,
    upiId:        '9404337568@upi',
    comingSoon:   false,
    fields: {
      leader: ['name', 'phone', 'email'],
      members: 3,
    },
  },

  'hackathon-24h': {
    id:           'hackathon-24h',
    name:         '24-Hour Hackathon',
    tagline:      'Ship something real in 24 hours. No excuses.',
    teamSize:     4,
    entryFee:     299,
    upiId:        '9404337568@upi',
    comingSoon:   false,
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
    entryFee:     49, // Token fee required for Razorpay QR integration
    upiId:        '9404337568@upi',
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
  eventConfigs['hackathon-24h'],
  eventConfigs['ipl-auction'],
  eventConfigs['startup-pitch'],
  eventConfigs['money-makers'],
]
