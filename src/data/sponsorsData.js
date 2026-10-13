import connexaaLogo from '../assets/logo-removebg-preview.png'
import centinezLogo from '../assets/centinez-logo.png'
import unstopLogo   from '../assets/unstop-logo.png'

export const mainSponsor = {
  id: 'connexaa',
  name: 'CONNEXAA',
  tagline: "India's Student-First Digital Campus Platform",
  logo: connexaaLogo,
  website: 'https://connexaa.in',
  role: 'Powered by',
  category: 'Digital Campus Platform',
}

export const secondarySponsors = [
  {
    id: 'centinez',
    name: 'Centinez',
    category: 'IT Services & Cybersecurity',
    tagline: 'Secure IT • Stable Business • Stronger Tomorrow',
    desc: 'Centinez is a forward-thinking IT services and cybersecurity firm committed to protecting businesses with robust, future-ready solutions. Their partnership with Success Squad reflects a shared belief in empowering the next generation of technology-driven entrepreneurs.',
    logo: centinezLogo,
    website: null,
  },
  {
    id: 'unstop',
    name: 'Unstop',
    category: "Platform Partner · E-Fest '26",
    tagline: 'Discover Talent • Build Communities • Win Together',
    desc: "Unstop is India's leading talent discovery, community, and competition platform — connecting students and professionals with opportunities that matter. As the official platform partner for E-Fest '26, Unstop powers registrations and helps us reach ambitious participants across the country.",
    logo: unstopLogo,
    website: 'https://unstop.com',
  },
]
