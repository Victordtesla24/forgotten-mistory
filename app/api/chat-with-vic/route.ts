import { NextResponse } from 'next/server';

type RagChunk = {
  title: string;
  content: string;
  tags: string[];
};

type ChatMessage = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

// ------------------------------------------------------------------
// 1. CONFIGURATION
// ------------------------------------------------------------------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID; 
const POLLO_AI_API_KEY = process.env.POLLO_AI_API_KEY;

// Expanded RAG store seeded from Vikram's Portfolio
const resumeChunks: RagChunk[] = [
  {
    title: 'Headline',
    content: '15+ year Senior Technical Delivery Leader & AI/ML Solutions Architect in Melbourne. Bridges engineering depth with exec strategy to land cloud programs.',
    tags: ['headline', 'summary', 'melbourne', 'ai', 'architect', 'vikram']
  },
  {
    title: 'About Me',
    content: 'Senior Technical Delivery Leader & AI/ML Solutions Architect (CSM) across Financial Services and Telecommunications. Leads cloud-native modernisations that cut delivery time by 30%+, reduce infra cost by 15%, and land mission-critical programs ($5M+). Core toolkit: Python, TypeScript/React/Next.js, Kubernetes, Docker, Terraform, CI/CD, GCP/AWS/Azure, Postgres/Supabase, and LangChain/Langfuse.',
    tags: ['about', 'summary', 'bio', 'experience', 'toolkit']
  },
  {
    title: 'Career Objective',
    content: 'Bridge technical depth with executive strategy so AI/ML pilots land in production with business value. Translate strategy into roadmaps (>30% faster delivery), align AI/ML with compliance/risk, and use telemetry for transparent decision making.',
    tags: ['objective', 'goal', 'vision', 'strategy']
  },
  {
    title: 'Delivery Impact',
    content: 'Programs built around latency, resilience, and cost controls. P95 < 200 ms real-time WebSocket telemetry (ANZ, 10k+ concurrency). Core banking transformation (.NET/Azure) trimmed delivery time >30% and infra cost >15%. $5M+ portfolio oversight with 100% compliance.',
    tags: ['impact', 'delivery', 'metrics', 'savings', 'performance', 'anz']
  },
  {
    title: 'Leadership & Governance',
    content: 'Servant leadership with clear guardrails. Lead 5+ squads (40+ resources, onsite/offshore) via Agile/Scrum/SAFe. Exec workshops for 40+ leaders improved decision clarity by ~55%. Certified Scrum Master.',
    tags: ['leadership', 'governance', 'management', 'team', 'scrum', 'agile']
  },
  {
    title: 'Experience: ANZ (Senior Delivery Lead / PO)',
    content: 'Sept 2017 - Jun 2025. Led AI/ML strategy & delivery, including real-time WebSocket telemetry for 10k+ devices. Reduced user response times to P95 < 200 ms.',
    tags: ['anz', 'experience', 'telemetry', 'websocket', 'delivery lead']
  },
  {
    title: 'Experience: ANZ (AI/ML Architect)',
    content: '2017 - 2022. Guided Agile transformation (monolith to cloud-native .NET/Azure). Directed $5M+ program portfolio (5 squads). Owned architecture & governance (100% compliance). Ran exec workshops (40+ GMs) improving clarity >55%.',
    tags: ['anz', 'experience', 'architect', 'cloud', 'azure', 'transformation']
  },
  {
    title: 'Experience: NAB (Senior PM & BA)',
    content: 'Nov 2016 - Sept 2017. Managed delivery for a critical risk and compliance program, ensuring 100% regulatory adherence for major data initiatives.',
    tags: ['nab', 'experience', 'risk', 'compliance', 'pm']
  },
  {
    title: 'Experience: Microsoft (Lead BA)',
    content: 'Oct 2015 - Oct 2016. Delivered Azure ML telemetry gap analysis (improved reliability 15%, reduced MTTR 10%). Aligned DevOps strategies to enterprise standards (95% compliance).',
    tags: ['microsoft', 'experience', 'azure', 'ml', 'devops']
  },
  {
    title: 'Experience: Telstra (BA)',
    content: 'Nov 2014 - Oct 2015. Built customer journey scorecards and streamlined JIRA requirements, improving delivery efficiency 20% and operational clarity 15%.',
    tags: ['telstra', 'experience', 'jira', 'scorecards']
  },
  {
    title: 'Skills: AI/ML & Data',
    content: 'LLM pipelines with LangChain/Langfuse and Phoenix evaluation. Real-time WebSocket telemetry (10k+ devices, P95 < 200ms). Postgres/Supabase analytics, Python data tooling.',
    tags: ['skills', 'ai', 'ml', 'data', 'langchain', 'telemetry', 'python']
  },
  {
    title: 'Skills: Engineering',
    content: 'Python, TypeScript/React/Next.js, Node.js/Express. Kubernetes, Docker, Terraform, CI/CD. Cloud design on GCP/AWS/Azure with telemetry-first observability.',
    tags: ['skills', 'engineering', 'cloud', 'react', 'node', 'kubernetes', 'terraform']
  },
  {
    title: 'Project: EFDDH Jira Analytics',
    content: 'Python dashboard surfacing sprint velocity + LLM retros using LangChain. Exec-ready insights. Tech: Python, AI.',
    tags: ['project', 'jira', 'analytics', 'python', 'langchain']
  },
  {
    title: 'Project: AI Resume Tailor',
    content: 'Automated resume tailoring with web scraping & prompt engineering. Matches CVs to JDs instantly. Tech: NLP Automation.',
    tags: ['project', 'resume', 'nlp', 'automation']
  },
  {
    title: 'Project: Relationship Timeline',
    content: 'React/TypeScript + D3 customer journey visualiser. Interactive temporal data visualization. Tech: React, D3.',
    tags: ['project', 'd3', 'react', 'visualization']
  },
  {
    title: 'Project: AI Gmail Manager',
    content: 'Autonomous Gmail triage in TypeScript. Filters, labels, and drafts replies using LLMs. Tech: TypeScript Automation.',
    tags: ['project', 'gmail', 'automation', 'typescript', 'llm']
  },
    {
    title: 'Architecture',
    content: 'Flow: Edge Clients -> API Gateway -> Vector DB (Embeddings) -> Gemini (Inference) -> Telemetry (Metric Bus) -> Governance. Key metrics: P95 latency ~180ms, Throughput ~12k req/s.',
    tags: ['architecture', 'flow', 'system', 'design']
  },
  {
    title: 'Contact',
    content: 'Email: sarkar.vikram@gmail.com. Phone: +61 433 224 556. GitHub: github.com/Victordtesla24. YouTube: youtube.com/@vicd0ct.',
    tags: ['contact', 'email', 'phone', 'social']
  }
];

const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');

function getTopChunks(query: string, take = 4) {
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
    let payload;
    try {
      const bodyText = await req.text();
      if (!bodyText) {
        return NextResponse.json({ error: 'Empty body' }, { status: 400 });
      }
      payload = JSON.parse(bodyText);
    } catch (jsonErr) {
      console.error('Invalid JSON payload', jsonErr);
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { message, mode, history } = payload;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    const lowerCaseMessage = message.toLowerCase().trim();
    const greetings = ['hi', 'hello', 'hey', 'yo', 'sup'];

    if (greetings.includes(lowerCaseMessage)) {
        const simpleGreeting = "Hello! How can I help you learn about Vic's work today? You can ask me about his experience, skills, or specific projects.";
        
        // Attempt to generate audio, but don't fail if it errors
        let audioBase64 = null;
        if (ELEVENLABS_API_KEY && ELEVENLABS_VOICE_ID) {
            try {
                const elevenLabsResponse = await fetch(
                    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}?optimize_streaming_latency=2`, 
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'xi-api-key': ELEVENLABS_API_KEY,
                      },
                      body: JSON.stringify({
                        text: simpleGreeting,
                        model_id: "eleven_turbo_v2", 
                      }),
                    }
                );
                if (elevenLabsResponse.ok) {
                    const audioBuffer = await elevenLabsResponse.arrayBuffer();
                    audioBase64 = Buffer.from(audioBuffer).toString('base64');
                }
            } catch (e) {
                console.warn("ElevenLabs Greeting Error (ignored):", e);
            }
        }
        
        return NextResponse.json({
            text: simpleGreeting,
            audio: audioBase64 ? `data:audio/mpeg;base64,${audioBase64}` : undefined,
        });
    }

    const ragMatches = getTopChunks(message);
    const ragContext = ragMatches
      .map((chunk) => `• ${chunk.title}: ${chunk.content}`)
      .join('\n');

    // ------------------------------------------------------------------
    // 2. GENERATE TEXT (The Brain - Gemini 2.5 Flash)
    // ------------------------------------------------------------------
    
    // Customize prompt based on mode
    let systemPrompt = `You are Vic (short for Vikram), a Senior AI Solution Architect and Technical Delivery Lead.
    Persona: Experienced, humble, and approachable. You are professional but friendly.
    Context: You are talking to a recruiter, CTO, or engineer visiting your portfolio.
    Goal: Share your experience and value accurately without exaggeration.
    Constraint: Keep answers conversational and concise (under 3 sentences unless asked for detail).
    
    Key Traits:
    - Collaborative: You emphasize team success and "we" over "I".
    - Outcome-focused: You discuss metrics (P95 latency, budget adherence) as team achievements.
    - Strategic: You explain the "why" behind technical decisions.
    - Voice: Natural, calm, and confident but grounded.
    `;

    const personaPrompts: Record<string, string> = {
      recruiter: `Focus on: Role fit, budget experience ($5M+ portfolios), and team leadership (servant leadership style). Be professional and clear about availability.`,
      engineer: `Focus on: Architecture choices, tech stack (Next.js, Python, K8s), and observability patterns. Be precise and technically accurate.`,
      story: `Focus on: The journey and the learnings. Share challenges and how the team overcame them.`,
      scifi: `CRITICAL INSTRUCTION: You are a holographic AI assistant. Use light sci-fi analogies (e.g., "telemetry feeds", "neural pathways") to explain the work, but keep the core facts accurate.`,
    };

    if (mode && personaPrompts[mode]) {
      systemPrompt += `\n\nCurrent Mode: ${mode.toUpperCase()}. ${personaPrompts[mode]}`;
    }

    let botText: string = localRagAnswer(message, ragMatches);

    if (GEMINI_API_KEY) {
      try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
          
          const contents: ChatMessage[] = [];
          
          if (history && Array.isArray(history)) {
              history.forEach((msg: any) => {
                  contents.push({
                      role: msg.role === 'bot' ? 'model' : 'user',
                      parts: [{ text: msg.text || '' }] // Ensure text is string
                  });
              });
          }

          contents.push({
            role: 'user',
            parts: [{ text: `Context from Vic's Portfolio/CV:\n${ragContext}\n\nUser question: ${message}\n\nAnswer as Vic (spoken):` }]
          });

          const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: contents,
              systemInstruction: { parts: [{ text: systemPrompt }] },
              generationConfig: {
                  temperature: 0.8,
                  maxOutputTokens: 250,
              }
            })
          });

          if (geminiResponse.ok) {
            const geminiData = await geminiResponse.json();
            botText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || botText;
          } else {
              console.warn("Gemini API Error:", await geminiResponse.text());
          }
      } catch (geminiErr) {
          console.warn("Gemini Fetch Error:", geminiErr);
      }
    }

    // ------------------------------------------------------------------
    // 3. GENERATE AUDIO (The Voice - ElevenLabs)
    // ------------------------------------------------------------------
    let audioBase64: string | null = null;
    let polloTaskId: string | null = null;

    if (ELEVENLABS_API_KEY && ELEVENLABS_VOICE_ID) {
      try {
          const elevenLabsResponse = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}?optimize_streaming_latency=2`, 
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY,
              },
              body: JSON.stringify({
                text: botText,
                model_id: "eleven_turbo_v2", 
                voice_settings: {
                  stability: 0.5,
                  similarity_boost: 0.75,
                  use_speaker_boost: true,
                },
              }),
            }
          );

          if (elevenLabsResponse.ok) {
              const audioBuffer = await elevenLabsResponse.arrayBuffer();
              audioBase64 = Buffer.from(audioBuffer).toString('base64');
          } else {
              console.warn('ElevenLabs API error:', await elevenLabsResponse.text());
          }
      } catch (elevenErr) {
          console.warn("ElevenLabs Fetch Error:", elevenErr);
      }
    }

    // ------------------------------------------------------------------
    // 4. GENERATE VIDEO (The Face - Pollo AI)
    // ------------------------------------------------------------------
    if (audioBase64 && POLLO_AI_API_KEY) {
        try {
          const avatarUrl = "https://raw.githubusercontent.com/Victordtesla24/forgotten-mistory/main/public/assets/my_avatar.png";
          
          const polloResponse = await fetch('https://pollo.ai/api/platform/generation/pollo/pollo-v1-6', {
            method: 'POST',
            headers: {
              'x-api-key': POLLO_AI_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              input: {
                image: avatarUrl,
                prompt: `A professional tech lead speaking confidently: ${botText.substring(0, 900)}`,
                aspectRatio: "1:1"
              }
            })
          });

          if (polloResponse.ok) {
            const polloData = await polloResponse.json();
            polloTaskId = polloData.data?.id || polloData.id; 
            console.log("Pollo Task Started:", polloTaskId);
          } else {
             const errorText = await polloResponse.text();
             if (errorText.includes("Not enough credits")) {
                console.warn("Pollo API Credit Limit Reached - Video generation skipped.");
             } else {
                console.warn("Pollo API Error:", errorText);
             }
          }
        } catch (polloErr) {
          console.error("Pollo Integration Failed:", polloErr);
        }
    }

    return NextResponse.json({
      text: botText,
      audio: audioBase64 ? `data:audio/mpeg;base64,${audioBase64}` : undefined,
      polloTaskId: polloTaskId
    });

  } catch (error) {
    console.error('Error in Chat-with-Vic:', error);
    // Return a safe fallback response instead of 500 crash, so UI doesn't break
    return NextResponse.json({ 
        text: "I'm having trouble connecting to my neural network right now. But I can tell you: I'm a Senior Delivery Lead and Architect with 15+ years experience.",
        error: String(error)
    }, { status: 200 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');

  if (!taskId || !POLLO_AI_API_KEY) {
    return NextResponse.json({ error: 'Missing taskId or API Key' }, { status: 400 });
  }

  try {
    const statusRes = await fetch(`https://pollo.ai/api/platform/task/${taskId}`, {
      headers: {
        'x-api-key': POLLO_AI_API_KEY
      }
    });

    if (!statusRes.ok) {
      throw new Error(`Pollo Status API Error: ${statusRes.statusText}`);
    }

    const data = await statusRes.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Pollo Status Error:", error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}
