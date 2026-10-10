/**
 * src/data/sponsorsData.js
 *
 * Official Event Sponsors & Partners for Success Squad E-Fest '26.
 * Includes tier categorization, official brand colors, SVGs, and partner links.
 */

export const sponsorTiers = [
  { id: 'all', label: 'All Partners' },
  { id: 'title', label: 'Title & Powered By' },
  { id: 'tech', label: 'Tech & Cloud' },
  { id: 'gaming', label: 'Gaming & Energy' },
  { id: 'media', label: 'Community & Media' },
]

export const sponsorsData = [
  {
    id: 'unstop',
    name: 'Unstop',
    category: 'Title & Platform Partner',
    tier: 'title',
    tag: 'Platform Partner',
    website: 'https://unstop.com',
    description: 'Official National Hackathon & Registration Platform Partner for CraftCode 2026',
    brandColor: '#1c49c2',
    accentColor: '#3b82f6',
    logoImg: '/images/unstop-logo.png',
    // High-precision vector logo SVG
    logoSvg: `
      <svg viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
        <rect width="44" height="44" rx="10" y="8" fill="#1C49C2"/>
        <path d="M14 36V20H20C25 20 28 23 28 28C28 33 25 36 20 36H14ZM18 32H20C22.5 32 24 30.5 24 28C24 25.5 22.5 24 20 24H18V32Z" fill="white"/>
        <path d="M30 36L34 20H37L33 36H30Z" fill="#60A5FA"/>
        <text x="56" y="38" font-family="'Space Grotesk', sans-serif" font-size="24" font-weight="800" fill="#ffffff" letter-spacing="1">UNSTOP</text>
      </svg>
    `,
  },
  {
    id: 'redbull',
    name: 'Red Bull',
    category: 'Official Energy & Esports Partner',
    tier: 'gaming',
    tag: 'Energy Partner',
    website: 'https://www.redbull.com',
    description: 'Energizing the BGMI & Free Fire LEC arena with adrenaline and wings',
    brandColor: '#db0a40',
    accentColor: '#ffd100',
    logoSvg: `
      <svg viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
        <circle cx="28" cy="30" r="20" fill="#FFD100"/>
        <path d="M14 32C18 24 26 23 34 27C30 31 23 33 14 32Z" fill="#DB0A40"/>
        <path d="M42 32C38 24 30 23 22 27C26 31 33 33 42 32Z" fill="#00186B"/>
        <text x="58" y="38" font-family="'Space Grotesk', sans-serif" font-size="22" font-weight="900" fill="#ffffff" letter-spacing="0.5">Red Bull</text>
      </svg>
    `,
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'Developer Community Partner',
    tier: 'tech',
    tag: 'Community Partner',
    website: 'https://github.com',
    description: 'Powering open-source student innovation, repo bounties, and developer tools',
    brandColor: '#24292e',
    accentColor: '#a855f7',
    logoSvg: `
      <svg viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
        <circle cx="28" cy="30" r="18" fill="#FFFFFF"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M28 16C20.26 16 14 22.26 14 30C14 36.2 18.02 41.44 23.6 43.3C24.3 43.42 24.56 43 24.56 42.62C24.56 42.28 24.54 41.16 24.54 39.96C21 40.62 20.14 38.94 19.86 38.16C19.7 37.76 19.02 36.5 18.42 36.16C17.92 35.9 17.22 35.24 18.4 35.22C19.5 35.2 20.3 36.22 20.56 36.64C21.8 38.74 23.8 38.16 24.58 37.8C24.7 36.9 25.06 36.3 25.46 35.94C22.36 35.6 19.12 34.38 19.12 28.98C19.12 27.44 19.66 26.18 20.56 25.18C20.42 24.82 19.92 23.36 20.7 21.4C20.7 21.4 21.88 21.04 24.58 22.86C25.7 22.54 26.9 22.38 28.1 22.38C29.3 22.38 30.5 22.54 31.62 22.86C34.32 21.02 35.5 21.4 35.5 21.4C36.28 23.36 35.78 24.82 35.64 25.18C36.54 26.18 37.08 27.42 37.08 28.98C37.08 34.4 33.82 35.6 30.72 35.94C31.22 36.38 31.66 37.22 31.66 38.54C31.66 40.44 31.64 41.96 31.64 42.44C31.64 42.82 31.9 43.26 32.62 43.12C38.18 41.24 42.2 36.02 42.2 30C42.2 22.26 35.74 16 28 16Z" fill="#181717"/>
        <text x="56" y="38" font-family="'Space Grotesk', sans-serif" font-size="22" font-weight="700" fill="#ffffff" letter-spacing="1">GitHub</text>
      </svg>
    `,
  },
  {
    id: 'aws',
    name: 'AWS Cloud',
    category: 'Cloud Infrastructure Partner',
    tier: 'tech',
    tag: 'Cloud Partner',
    website: 'https://aws.amazon.com',
    description: 'Cloud credits, AI sandbox environments, and infrastructure for hackathon finalists',
    brandColor: '#ff9900',
    accentColor: '#232f3e',
    logoSvg: `
      <svg viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
        <rect width="44" height="44" rx="10" y="8" fill="#232F3E"/>
        <path d="M12 28L18 16H23L16 28H12ZM22 28L28 16H32L26 28H22ZM15 32C22 37 32 37 39 31C40 30 38 29 37 30C31 34 22 34 16 30C15 29 14 31 15 32Z" fill="#FF9900"/>
        <text x="56" y="38" font-family="'Space Grotesk', sans-serif" font-size="24" font-weight="800" fill="#ffffff" letter-spacing="1.5">AWS</text>
      </svg>
    `,
  },
  {
    id: 'polygon',
    name: 'Polygon Guild',
    category: 'Web3 & Innovation Partner',
    tier: 'tech',
    tag: 'Web3 Partner',
    website: 'https://polygon.technology',
    description: 'Decentralized track tracks, dApp grants, and student mentorship',
    brandColor: '#8247e5',
    accentColor: '#a855f7',
    logoSvg: `
      <svg viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
        <rect width="44" height="44" rx="10" y="8" fill="#8247E5"/>
        <path d="M22 24L28 20L34 24V32L28 36L22 32V24Z" stroke="white" stroke-width="2.5" fill="none"/>
        <circle cx="28" cy="28" r="3" fill="#ffffff"/>
        <text x="56" y="38" font-family="'Space Grotesk', sans-serif" font-size="21" font-weight="700" fill="#ffffff" letter-spacing="0.5">POLYGON</text>
      </svg>
    `,
  },
  {
    id: 'codingninjas',
    name: 'Coding Ninjas',
    category: 'Upskilling & Education Partner',
    tier: 'tech',
    tag: 'Learning Partner',
    website: 'https://www.codingninjas.com',
    description: 'Providing interview preparation toolkits and pro subscription awards',
    brandColor: '#f9593a',
    accentColor: '#ea580c',
    logoSvg: `
      <svg viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
        <rect width="44" height="44" rx="10" y="8" fill="#F9593A"/>
        <path d="M16 26H32M16 32H28M24 20L20 38" stroke="white" stroke-width="3" stroke-linecap="round"/>
        <text x="56" y="38" font-family="'Space Grotesk', sans-serif" font-size="18" font-weight="700" fill="#ffffff" letter-spacing="0.5">Coding Ninjas</text>
      </svg>
    `,
  },
  {
    id: 'nodwin',
    name: 'NODWIN Gaming',
    category: 'Esports Broadcast & League Partner',
    tier: 'gaming',
    tag: 'Esports Partner',
    website: 'https://nodwingaming.com',
    description: 'Broadcasting BGMI LEC live scrims, caster commentary, and rules adjudication',
    brandColor: '#00e5ff',
    accentColor: '#06b6d4',
    logoSvg: `
      <svg viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
        <rect width="44" height="44" rx="10" y="8" fill="#0A0F1D" stroke="#00E5FF" stroke-width="2"/>
        <path d="M17 35L24 21L31 35H27L24 29L21 35H17Z" fill="#00E5FF"/>
        <text x="56" y="38" font-family="'Space Grotesk', sans-serif" font-size="20" font-weight="800" fill="#ffffff" letter-spacing="1">NODWIN</text>
      </svg>
    `,
  },
  {
    id: 'campustimes',
    name: 'Campus Times Pune',
    category: 'Official Youth Media Partner',
    tier: 'media',
    tag: 'Media Partner',
    website: 'https://campustimespune.com',
    description: 'Extensive press coverage, festival photography, and student spotlighting',
    brandColor: '#f43f5e',
    accentColor: '#fb7185',
    logoSvg: `
      <svg viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
        <rect width="44" height="44" rx="10" y="8" fill="#F43F5E"/>
        <path d="M17 22H31V26H26V38H22V26H17V22Z" fill="white"/>
        <text x="56" y="34" font-family="'Space Grotesk', sans-serif" font-size="16" font-weight="800" fill="#ffffff">CAMPUS TIMES</text>
        <text x="56" y="47" font-family="'Inter', sans-serif" font-size="10" font-weight="600" fill="#94a3b8" letter-spacing="1">PUNE MEDIA</text>
      </svg>
    `,
  },
]
