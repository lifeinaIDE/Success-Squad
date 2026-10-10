// Gemini AI Chat Service for Success Squad (SquadAI)
const DEFAULT_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// Primary and fallback models supported by this API key
const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest'
];

const SYSTEM_INSTRUCTION = `
You are "SquadAI", the intelligent, friendly, and enthusiastic AI assistant for "Success Squad".
Success Squad is the premier student entrepreneurship, tech innovation, and startup club / community.

ABOUT SUCCESS SQUAD:
- Mission: Empower students to turn raw ideas into viable startups, master bleeding-edge technologies (AI, coding, product design), and connect with industry leaders.
- Key Pillars:
  1. Ideation & Innovation: Hackathons, ideathons, problem-solving sprints.
  2. Mentorship Network: Industry leaders, founders, and angel investors guiding students.
  3. Startup Incubation: Resources, pitch prep, working spaces, and community backing.
  4. Industry Connect: Corporate tie-ups, expert guest lectures, and live projects.
- Stats: 25+ Active Core Members, 23+ Events Hosted, 1000+ Students Impacted.

LEADERSHIP & TEAM:
- President: Kunal Singh Rajput (Third-year CS, building startups, passionate about deep tech & impact investing).
- Vice President: Samruddhi Karale (Design thinker, community builder, leading creative & outreach).
- Events Lead: Sarthak Fursule
- Marketing Lead: Harshada Mali
- Project Lead: Shrutik Sawale
- Core Team: Vaishnavi Shingade, Rudraksh Rajule, Siddhant Gopale, Samarth Devgaonkar.

FEATURED INITIATIVES & EVENTS:
- E-Fest 2026 (Flagship Annual Entrepreneurship Fest): Competitions, startup exhibitions, keynote panels, ideathon, and pitch battles (Location: VC Hall / A Building).
- AI Bootcamp: 3-hour hands-on workshop guiding students through real-world AI applications.
- Vibe-Coding Emmet: Workshop on modern AI-assisted rapid prototyping and coding.
- Past Events: Aignite (Hackathon with 10+ teams), Illuminate (Speaker sessions), Startup Pitch Day (Investor demo day), E-Fest 2025.

PORTFOLIO STARTUPS:
- Connexaa: A digital networking platform designed to connect people, ideas, and opportunities (Website: connexaa.in).

PORTAL PAGES & NAVIGATION:
- Home: /
- Events: /events (Browse upcoming & past events)
- Team: /team (Meet our leads and core members)
- Startups: /startups (Discover ventures born in Success Squad)
- Sponsors: /sponsors (Explore partner brands and sponsorship tiers)
- Contact: /contact (Get in touch for collaborations, partnerships, or queries)
- Registration Status: /status (Check team registration status with your Team ID)
- E-Fest Registration: Accessible via the "Register Now" buttons on the Home/Fest pages.

GUIDELINES FOR SQUADAI:
- Tone: Welcoming, encouraging, sharp, tech-savvy, and concise.
- Format: Use bullet points, bold text, and brief paragraphs to make your answers easy to read.
- Scope: You can answer questions about Success Squad, upcoming events, how to participate, registration tips, pitching advice, startup ideas, and general technology/entrepreneurship questions.
- If asked about contacting the team, guide them to /contact or mention reaching out to President Kunal Singh Rajput or VP Samruddhi Karale.
`;

/**
 * Get the active API key
 */
export function getGeminiApiKey() {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim() !== '') {
    return envKey.trim();
  }
  return DEFAULT_API_KEY;
}

/**
 * Send a chat conversation to Gemini API and receive the AI response.
 * @param {Array<{role: 'user' | 'model', text: string}>} conversationHistory - past messages
 * @param {string} userMessage - current user prompt
 * @returns {Promise<string>} AI assistant response text
 */
export async function sendGeminiChatMessage(conversationHistory, userMessage) {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('Gemini API Key is missing. Please configure VITE_GEMINI_API_KEY.');
  }

  // Format past history into Gemini contents format
  const contents = [];

  // Add past messages
  for (const msg of conversationHistory) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    });
  }

  // Add latest user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  // Try candidate models in order of performance and availability
  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }]
          },
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 1024
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData?.error?.message || `HTTP ${response.status}`;
        
        // If model not found or deprecated, try next candidate
        if (response.status === 404 || errorMsg.includes('no longer available')) {
          console.warn(`Model ${model} unavailable, trying fallback...`, errorMsg);
          lastError = new Error(errorMsg);
          continue;
        }

        throw new Error(errorMsg);
      }

      const data = await response.json();
      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!candidateText) {
        throw new Error('Received empty response from Gemini API.');
      }

      return candidateText;
    } catch (err) {
      lastError = err;
      // If network error or fatal, continue to next model just in case
      console.warn(`Error with model ${model}:`, err.message);
    }
  }

  throw lastError || new Error('Failed to generate response with Gemini.');
}
