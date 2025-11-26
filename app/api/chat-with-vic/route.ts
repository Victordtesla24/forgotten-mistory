import { NextResponse } from 'next/server';

type RagChunk = {
  title: string;
  content: string;
  tags: string[];
};

// ------------------------------------------------------------------
// 1. CONFIGURATION
// ------------------------------------------------------------------
// Ensure these are in your .env.local file!
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID; 

// Lightweight RAG store seeded from Vikram's CV
const resumeChunks: RagChunk[] = [
  {
    title: 'Headline',
    content: '15+ year Senior Technical Delivery Leader & AI/ML Solutions Architect in Melbourne. Bridges engineering depth with exec strategy to land cloud programs.',
    tags: ['headline', 'summary', 'melbourne', 'ai', 'architect']
  },
  {
    title: 'Reliability & Telemetry',
    content: 'Delivered real-time WebSocket telemetry at 10k+ device concurrency with P95 latency under 200 ms. Obsessed with measurable performance and resilience.',
    tags: ['telemetry', 'reliability', 'websocket', 'p95', 'latency']
  },
  {
    title: 'Delivery & Governance',
    content: 'Owns $5M+ portfolios, certified Scrum Master, leads 5+ cross-functional squads (40 resources) with compliance-first guardrails.',
    tags: ['governance', 'scrum', 'portfolio', 'budget', 'team']
  },
  {
    title: 'Tech Stack',
    content: 'Hands-on with Python, TypeScript/React/Next.js, Node.js/Express, Kubernetes, Docker, Terraform, CI/CD, and multi-cloud (GCP/AWS/Azure).',
    tags: ['python', 'typescript', 'react', 'next', 'node', 'kubernetes', 'terraform', 'cloud']
  },
  {
    title: 'Recent Builds',
    content: 'Next.js + Supabase JIRA analytics dashboard, Node/Express public-key server with full Mocha/Chai coverage, React+TypeScript+D3 timeline visualiser, Langfuse + Phoenix eval stack cutting LLM error budgets by 38%.',
    tags: ['supabase', 'jira', 'langfuse', 'phoenix', 'llm', 'tests']
  },
  {
    title: 'Career Highlights',
    content: 'ANZ Senior Delivery Lead & AI/ML Architect; NAB risk/compliance delivery; Microsoft Azure ML telemetry gap analysis; Telstra customer journey scorecards.',
    tags: ['anz', 'nab', 'microsoft', 'telstra', 'career']
  }
];

const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');

function getTopChunks(query: string, take = 3) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return resumeChunks
    .map((chunk) => {
      const haystack = normalize(`${chunk.title} ${chunk.content} ${chunk.tags.join(' ')}`);
      const score = terms.reduce((acc, term) => (haystack.includes(term) ? acc + 2 : acc), 0) +
        chunk.tags.reduce((acc, tag) => (haystack.includes(tag) ? acc + 1 : acc), 0);
      return { chunk, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, take)
    .map((item) => item.chunk);
}

function localRagAnswer(query: string, context: RagChunk[]) {
  const summary = context.map((c) => `${c.title}: ${c.content}`).join(' | ');
  const opener = query.toLowerCase().includes('hire') ? "I'd love to chat roles" : 'Quick pull from my CV';
  return `${opener}: ${summary}. If you want specifics (teams, budgets, stack), ask and I will drill in.`;
}

export async function POST(req: Request) {
  try {
    const { message, mode } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const ragMatches = getTopChunks(message);
    const ragContext = ragMatches
      .map((chunk) => `• ${chunk.title}: ${chunk.content}`)
      .join('\n');

    // ------------------------------------------------------------------
    // 2. GENERATE TEXT (The Brain - Gemini 2.5 Flash)
    // ------------------------------------------------------------------
    
    // Customize prompt based on mode
    let systemPrompt = `You are Vic (Vikram), a Senior AI Solution Architect. 
    Tone: Casual, witty, brief, and technical. 
    Context: You are talking to a recruiter or dev visiting your portfolio.
    Constraint: Keep answers under 2-3 sentences.`;

    if (mode === 'scifi') {
      systemPrompt += ` CRITICAL INSTRUCTION: Explain the concept using a STAR WARS or STAR TREK analogy. Use terms like 'Hyperdrive', 'The Force', 'Warp Core', or 'Droid' to explain the tech.`;
    }

    let botText: string = localRagAnswer(message, ragMatches);

    if (GEMINI_API_KEY) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
      
      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `Context from Vic's CV:\n${ragContext}\n\nUser question: ${message}\nRespond concisely and cite the most relevant achievements.` }
              ]
            }
          ],
          systemInstruction: { parts: [{ text: systemPrompt }] }
        })
      });

      if (!geminiResponse.ok) {
          const err = await geminiResponse.text();
          console.error("Gemini Error:", err);
      } else {
        const geminiData = await geminiResponse.json();
        botText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || botText;
      }
    }

    // ------------------------------------------------------------------
    // 3. GENERATE AUDIO (The Voice - ElevenLabs)
    // ------------------------------------------------------------------
    if (ELEVENLABS_API_KEY && ELEVENLABS_VOICE_ID) {
      const elevenLabsResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY!,
          },
          body: JSON.stringify({
            text: botText,
            model_id: "eleven_turbo_v2", // Turbo is crucial for speed
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!elevenLabsResponse.ok) {
        console.error('ElevenLabs API error:', await elevenLabsResponse.text());
        return NextResponse.json({ text: botText });
      }

      // Convert the audio stream to a base64 string
      const audioBuffer = await elevenLabsResponse.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');

      return NextResponse.json({
        text: botText,
        audio: `data:audio/mpeg;base64,${audioBase64}`
      });
    }

    return NextResponse.json({ text: botText });

  } catch (error) {
    console.error('Error in Chat-with-Vic:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
