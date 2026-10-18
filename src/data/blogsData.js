/**
 * src/data/blogsData.js
 *
 * Data source for all Success Squad blogs, founder guides, and campus stories.
 */

export const blogCategories = [
  'All',
  'Entrepreneurship',
  'Tech & Innovation',
  'Pitching & Funding',
  'Campus Stories',
]

export const blogsData = [
  {
    id: 'dorm-room-to-deal-flow',
    slug: 'from-dorm-room-to-deal-flow',
    title: 'From Dorm Room to Deal Flow: How Student Founders Turn Campus Projects into Funded Startups',
    excerpt: 'Building a scalable venture while studying engineering is daunting — but campus provides the highest-leverage sandbox in the world. Here is the blueprint our incubation cell uses.',
    category: 'Entrepreneurship',
    featured: true,
    coverImage: '/images/blogs/student-startup-incubation.jpg',
    readTime: '6 min read',
    date: 'Oct 16, 2026',
    author: {
      name: 'Mayuresh Jagtap',
      role: 'Lead & Co-Founder, Success Squad',
      avatar: '/images/mayuresh-jagtap.jpg',
      bio: 'Final year engineer, founder of Connexaa, and student entrepreneurship evangelist passionate about campus-led innovation.',
    },
    tags: ['Startups', 'Incubation', 'MVP', 'Student Founders'],
    sections: [
      {
        heading: 'The Unfair Advantage of Being a Student Founder',
        content: [
          'Most people think starting a company in college is reckless. You have internal exams, assignment deadlines, lab submissions, and attendance quotas breathing down your neck. But after mentoring dozens of campus teams at Success Squad, we have realized the opposite is true: university is the ultimate startup incubator.',
          'As a student founder, your operational burn rate is close to zero. You have access to hundreds of potential early adopters living in the same hostel corridors, state-of-the-art computer labs, and mentors who genuinely want you to succeed. When a student reaches out to a senior VC or CEO on LinkedIn asking for advice, the response rate is 5x higher than when a corporate employee does the same.',
        ],
      },
      {
        heading: 'Phase 1: Escaping the "Hackathon Toy" Trap',
        content: [
          'The biggest mistake campus innovators make is building in a vacuum. A team spends 48 hours at a hackathon creating an impressive AI-powered resume analyzer with three cool UI animations. The judges applaud, they win second runner-up, and then the repository collects dust on GitHub.',
          'To bridge the gap between a hackathon project and an investable venture, you must pivot from solving a prompt to solving an authentic user pain point. Talk to at least 25 real people who face the problem every week. If none of them are willing to give you their phone number or pre-order your prototype, you do not have a business yet — you just have code.',
        ],
      },
      {
        heading: 'Phase 2: Building Your 10x MVP in Under 2 Weeks',
        content: [
          'Speed is your only moated asset against well-funded incumbents. When we helped launch Connexaa at JSPM NTC, the initial version was not an intricate microservices backend. It was a fast, responsive web application focused on one core job: connecting students directly with verified campus resources.',
          'Strip away the auxiliary features. Do not waste three weeks building dark mode toggles or complex notification settings before you have 50 active daily users who depend on your core value proposition.',
        ],
        callout: {
          title: 'The Golden Rule of MVPs',
          text: 'If you are not slightly embarrassed by the first release of your product, you launched too late. Focus ruthlessly on utility over vanity metrics.',
        },
      },
      {
        heading: 'Phase 3: The Pitch Deck That Grabs Seed Funding',
        content: [
          'Investors do not expect a student startup to report ₹10 Lakhs in monthly recurring revenue. What they do look for is founder velocity: how fast can your team learn, iterate, and adapt based on feedback?',
          'Structure your narrative around five core pillars: The Urgent Problem, Your Unfair Solution, Traction & Velocity, Unit Economics, and Why Your Team is Irrationally Committed to this vision.',
        ],
      },
      {
        heading: 'Looking Ahead: Success Squad at E-Fest \'26',
        content: [
          'This is why we created the Startup Pitch Battle at E-Fest \'26. With cash grants, direct investor exposure, and incubator slots up for grabs, this is your arena to step out of the shadows and validate what you have built with industry leaders.',
          'If you have been tinkering on a side project late at night in your room, this is your sign. Stop waiting for the perfect moment. Ship it, pitch it, and let the market decide.',
        ],
      },
    ],
  },
  {
    id: 'craftcode-24hr-hackathon',
    slug: 'the-24-hour-sprint-lessons-from-craftcode',
    title: 'The 24-Hour Sprint: How to Ship Production-Ready Code Under Pressure',
    excerpt: 'Hackathons are not just coding marathons; they are pressure cookers for product sense and teamwork. Here is how winning teams ideate, delegate, and deploy in 24 hours.',
    category: 'Tech & Innovation',
    featured: false,
    coverImage: '/images/blogs/hackathon-engineering.jpg',
    readTime: '5 min read',
    date: 'Oct 14, 2026',
    author: {
      name: 'Atharva Chechare',
      role: 'Head of Tech & Hackathons, EDC',
      avatar: '/images/atharva-chechare.jpg',
      bio: 'Full-stack architect and competitive programmer passionate about developer tooling and real-time systems.',
    },
    tags: ['Hackathons', 'CraftCode', 'Dev', 'Productivity'],
    sections: [
      {
        heading: 'Hour 0 to 3: The Architecture That Prevents Late-Night Meltdowns',
        content: [
          'Nothing ruins a hackathon faster than git merge conflicts at 4:00 AM. Winning teams lock down their API schema, component boundaries, and database models in the first two hours before writing a single line of business logic.',
          'Agree on your data contracts upfront. Use tools like Supabase or mock JSON servers so your frontend and backend engineers can build in complete parallel without blocking each other.',
        ],
      },
      {
        heading: 'The 80/20 Rule for Demo-Driven Development',
        content: [
          'Hackathon judges spend an average of 3 to 5 minutes reviewing your project. That means your primary user journey must be 100% bug-free, intuitive, and visually compelling.',
          'Never leave styling and UI polish to the last 30 minutes. A product with 2 rock-solid features and a sleek, modern UI will almost always outscore a buggy system claiming to have 10 half-baked integrations.',
        ],
        callout: {
          title: 'Pro Tip for CraftCode Competitors',
          text: 'Record a 30-second silent screen recording of your working demo early Sunday morning. If the live server glitches or the WiFi hiccups during presentation, your backup video will save the day.',
        },
      },
      {
        heading: 'CraftCode at E-Fest \'26',
        content: [
          'With registrations powered by Unstop and teams competing from all over the region, CraftCode is designed to test your limits. Bring your best ideas, prepare your tech stack in advance, and get ready to ship something unforgettable.',
        ],
      },
    ],
  },
  {
    id: 'mastering-the-3-minute-pitch',
    slug: 'mastering-the-3-minute-pitch-investor-secrets',
    title: 'The Art of the 3-Minute Pitch: What Angel Investors Actually Look For',
    excerpt: 'You have exactly 180 seconds to convince seasoned judges that your student startup deserves capital and mentorship. Here is how to make every single second count.',
    category: 'Pitching & Funding',
    featured: false,
    coverImage: '/images/blogs/pitch-presentation-summit.jpg',
    readTime: '4 min read',
    date: 'Oct 11, 2026',
    author: {
      name: 'Kunal Singh Rajput',
      role: 'Head of Strategic Partnerships, EDC',
      avatar: '/images/kunal-singh-rajput.jpg',
      bio: 'Fintech enthusiast and strategic lead connecting student ventures with venture capitalists and corporate angel networks.',
    },
    tags: ['Pitching', 'Venture Capital', 'Angel Investors', 'Presentation'],
    sections: [
      {
        heading: 'The Hook: Win the First 20 Seconds',
        content: [
          'Investors hear dozens of pitches every single week. If your presentation begins with "Hello everyone, my name is X and today I will present slide 1...", you have already lost the room.',
          'Start with a provocative statistic, a relatable personal story, or an unexpected market paradox. Make the problem visceral before you even introduce your startup name.',
        ],
      },
      {
        heading: 'Ditch the Jargon: Clarity Equals Conviction',
        content: [
          'Cluttering your slides with buzzwords like "Next-Gen AI-driven Blockchain Synergy" signals a lack of substance. The strongest founders explain complex technologies in simple, punchy, conversational sentences.',
          'If a high school student or an elderly grandparent cannot understand what your product does within 30 seconds of your explanation, you need to simplify your script.',
        ],
        callout: {
          title: 'The Slide Rule',
          text: 'Maximum 6 to 8 slides for a 3-minute pitch. More than that guarantees you will rush and lose the audience.',
        },
      },
      {
        heading: 'Nail the Q&A Session',
        content: [
          'The pitch gets their attention, but the Q&A wins the prize. When an investor questions your customer acquisition cost or churn rate, never dodge or bluff. If you do not know the exact number, state your current hypothesis and the experiment you are running to verify it.',
        ],
      },
    ],
  },
  {
    id: 'building-connexaa-story',
    slug: 'building-connexaa-student-led-digital-campus-platform',
    title: 'Building Connexaa: The Journey of a Student-Led Digital Campus Platform',
    excerpt: 'How a student initiative born out of TSSM & JSPM NTC grew into a campus-wide platform connecting thousands of students with resources, events, and opportunities.',
    category: 'Campus Stories',
    featured: false,
    coverImage: '/images/success-squad-team.jpg',
    readTime: '5 min read',
    date: 'Oct 08, 2026',
    author: {
      name: 'Mayuresh Jagtap',
      role: 'Founder, Connexaa',
      avatar: '/images/mayuresh-jagtap.jpg',
      bio: 'Product architect passionate about decentralizing opportunity and building campus ecosystems.',
    },
    tags: ['Case Study', 'Connexaa', 'Student Venture', 'Success Stories'],
    sections: [
      {
        heading: 'The Problem Hidden in Plain Sight',
        content: [
          'In every university campus across India, communication is fragmented. Critical updates are buried in endless WhatsApp groups, hackathon announcements get lost on bulletin boards, and valuable peer collaboration rarely happens outside immediate friend circles.',
          'Connexaa started with a simple hypothesis: what if students had a unified, high-speed digital hub custom-tailored to their campus life, academic milestones, and entrepreneurial ambitions?',
        ],
      },
      {
        heading: 'Scaling from 50 to Thousands',
        content: [
          'Our initial rollout was tested with our closest peers. We listened to every complaint, fixed bugs within hours, and stayed laser-focused on usability and reliability.',
          'Today, as the premier digital partner for Success Squad and E-Fest \'26, Connexaa demonstrates what happens when students are empowered to solve problems for their own generation.',
        ],
        callout: {
          title: 'Our Biggest Takeaway',
          text: 'You do not need to wait until graduation to build something that touches thousands of lives. The best time to start was yesterday; the next best time is right now.',
        },
      },
    ],
  },
]
