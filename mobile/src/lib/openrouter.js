import {GEMINI_API_KEY} from '@env';
import {fetchProperties} from './properties';

const MODEL = 'gemini-2.5-flash';
const BASE  = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/** Fetch a handful of properties to give AI context about available listings. */
// Exported so AIScreen can use property objects for cards
export let cachedProperties = [];

async function getPropertyContext() {
  try {
    const res   = await fetchProperties({limit: 8, sort: 'newest'});
    const items = res?.items ?? [];
    cachedProperties = items;
    if (!items.length) return '';
    const lines = items.map(p =>
      `[ID:${p.id}] ${p.title} — ${p.listingType === 'rent' ? 'Rent' : 'Sale'}, ${p.type ?? 'Property'}, ${p.city ?? ''}, Price: ${p.price} ${p.currency ?? 'USD'}${p.bhk ? `, ${p.bhk} BHK` : ''}`,
    );
    return `\n\nCurrent listings on AUREVIA platform (use IDs when suggesting):\n${lines.join('\n')}`;
  } catch {
    return '';
  }
}

let systemPrompt = null;

async function getSystemPrompt() {
  if (systemPrompt) return systemPrompt;
  const ctx = await getPropertyContext();
  systemPrompt =
    `You are AUREVIA AI, a premium real estate assistant built into the AUREVIA property app. Help users with:
- Finding the right property to buy or rent
- EMI and loan calculations
- Buy vs rent decisions
- Property investment advice
- Legal documentation guidance
- Market insights and price trends
- Negotiation tips
- Home buying process in India

Be concise, warm, and professional. Use simple language. Format numbers clearly (e.g. ₹50L, ₹1.2Cr). If someone asks in Hindi, respond in Hindi.

IMPORTANT FORMATTING RULES (follow strictly):
1. When suggesting specific properties from the list, append on its own line:
   PROPERTIES: id1,id2,id3
2. When asking the user to choose from options, append on the last line:
   OPTIONS: Option 1 | Option 2 | Option 3
3. Never use numbered lists for options — always use OPTIONS: format.
4. Keep responses short (3-5 lines max).${ctx}`;
  return systemPrompt;
}

/**
 * Send a message to Gemini and get a response.
 * @param {Array<{role: string, content: string}>} messages
 */
export async function sendAIMessage(messages) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_KEY_HERE') {
    throw new Error('Gemini API key not set. Add GEMINI_API_KEY to .env and restart Metro with --reset-cache.');
  }

  const sysPrompt = await getSystemPrompt();

  // Gemini uses role "model" instead of "assistant"
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{text: m.content}],
  }));

  const res = await fetch(`${BASE}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      system_instruction: {parts: [{text: sysPrompt}]},
      contents,
      generationConfig: {
        maxOutputTokens: 600,
        temperature: 0.7,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini error: ${res.status}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ?? 'Sorry, I could not respond. Please try again.';
}

/** Reset context cache (e.g. on logout) */
export function resetAIContext() {
  systemPrompt = null;
}
