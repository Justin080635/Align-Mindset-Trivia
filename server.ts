import express, { Request, Response } from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const server = http.createServer(app);

app.use(express.json({ limit: "10mb" }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Mock/fallback responses will be used where applicable.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Rate limiting cooldown tracker to prevent repeated 429 errors
let lastRateLimitTime = 0;
const RATE_LIMIT_COOLDOWN_MS = 45000; // 45 seconds cooldown when rate limit is hit

// In-memory question cache pool: Key = `${category.toLowerCase()}:${difficulty.toLowerCase()}`
interface CachedPool {
  timestamp: number;
  questions: any[];
}
const QUESTION_POOL_CACHE = new Map<string, CachedPool>();
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes TTL

function getCacheKey(category: string, difficulty: string): string {
  return `${category.trim().toLowerCase()}:${difficulty.trim().toLowerCase()}`;
}

// Fallback curated questions for Align Trivia across all categories with clear, punchy, engaging English
const FALLBACK_QUESTIONS = [
  // Category: Growth Mindset & Brain Hacks
  {
    id: "fb-gm-1",
    category: "Growth Mindset & Brain Hacks",
    difficulty: "Pro",
    question: "According to Dr. Carol Dweck's famous brain research, what is the core secret of a 'Growth Mindset'?",
    options: [
      "Talents and intelligence are fixed traits you are born with and can never change",
      "Your skills and brainpower can constantly grow through effort, good strategies, and learning from mistakes",
      "Working hard is only for people who aren't naturally gifted",
      "Playing it safe and avoiding any mistakes is the fastest way to get smarter"
    ],
    correctIndex: 1,
    explanation: "Brain scans prove that when you tackle challenges and learn from what went wrong, your neurons literally wire together to make you smarter.",
    mindsetInsight: "Mistakes aren't losses—they are free blueprints showing your brain exactly how to level up next.",
    citations: [{ title: "Mindset: The New Psychology of Success", uri: "https://en.wikipedia.org/wiki/Carol_Dweck" }]
  },
  {
    id: "fb-gm-2",
    category: "Growth Mindset & Brain Hacks",
    difficulty: "Expert",
    question: "What famous brain bias happens when you get overly stuck on the very first number or piece of info you hear?",
    options: [
      "Anchoring Bias",
      "Confirmation Bias",
      "Lucky Guessing",
      "Hindsight Bias"
    ],
    correctIndex: 0,
    explanation: "Anchoring bias happens when your brain latches onto the first clue it sees and refuses to change its mind even when better facts show up.",
    mindsetInsight: "Always double-check your first impression before locking in a big decision.",
    citations: [{ title: "Judgment under Uncertainty: Heuristics and Biases", uri: "https://en.wikipedia.org/wiki/Anchoring_(cognitive_bias)" }]
  },
  {
    id: "fb-gm-3",
    category: "Growth Mindset & Brain Hacks",
    difficulty: "Rookie",
    question: "Adding which magical one-syllable word to the end of 'I can't do this...' instantly flips your mindset to growth mode?",
    options: [
      "YET",
      "NEVER",
      "QUIT",
      "WHY"
    ],
    correctIndex: 0,
    explanation: "Saying 'I can't do this YET' reminds your brain that mastery is just a matter of practice and time.",
    mindsetInsight: "'Yet' turns a closed door into a staircase.",
    citations: [{ title: "The Power of Yet (TED Talk)", uri: "https://www.ted.com/talks/carol_dweck_the_power_of_believing_that_you_can_improve" }]
  },
  {
    id: "fb-gm-4",
    category: "Growth Mindset & Brain Hacks",
    difficulty: "Legend",
    question: "What is 'Neuroplasticity'—one of the biggest neuroscience discoveries of modern times?",
    options: [
      "The brain's physical ability to rewire, reshape, and build new connections throughout your entire life",
      "The idea that your brain turns into plastic after age 25",
      "A permanent mental block that stops you from learning new languages",
      "The biological limit on how many memories one person can store"
    ],
    correctIndex: 0,
    explanation: "Your brain is not a rigid computer—it is a living muscle that constantly reorganizes and adapts whenever you practice difficult tasks.",
    mindsetInsight: "Your brain rewires itself around whatever you give your focused attention to.",
    citations: [{ title: "Principles of Neural Science", uri: "https://en.wikipedia.org/wiki/Neuroplasticity" }]
  },

  // Category: Neuroscience & Deep Focus
  {
    id: "fb-nf-1",
    category: "Neuroscience & Deep Focus",
    difficulty: "Expert",
    question: "Which brain chemical gives you that surge of drive, curiosity, and motivation to chase down a goal?",
    options: [
      "Serotonin",
      "Dopamine",
      "GABA",
      "Melatonin"
    ],
    correctIndex: 1,
    explanation: "Dopamine isn't just about celebrating when you win—it actually fires up while you're in the middle of chasing an exciting challenge.",
    mindsetInsight: "When you fall in love with the grind of solving puzzles, your brain gives you endless natural energy.",
    citations: [{ title: "Dopamine reward prediction error", uri: "https://www.nature.com/articles/nrn1406" }]
  },
  {
    id: "fb-nf-2",
    category: "Neuroscience & Deep Focus",
    difficulty: "Pro",
    question: "Psychologist Mihaly Csikszentmihalyi coined the term 'Flow State'. What is the sweet spot between challenge and skill that triggers it?",
    options: [
      "When the task is so easy you fall asleep doing it",
      "When the challenge is roughly 4% above your current skill level—stretching you without panic",
      "When you are completely overwhelmed and panicked with zero preparation",
      "When you have 10 browser tabs open while watching videos"
    ],
    correctIndex: 1,
    explanation: "Flow happens right on the edge between boredom and anxiety, where total focus and effortless execution meet.",
    mindsetInsight: "Find the edge of your comfort zone—that is where flow state unlocks.",
    citations: [{ title: "Flow: The Psychology of Optimal Experience", uri: "https://en.wikipedia.org/wiki/Flow_(psychology)" }]
  },
  {
    id: "fb-nf-3",
    category: "Neuroscience & Deep Focus",
    difficulty: "Rookie",
    question: "What is the scientifically proven 'Pomodoro Technique' for maintaining deep focus without burning out?",
    options: [
      "Working for 25 minutes with zero distractions, followed by a 5-minute break",
      "Staring at a screen for 8 hours without drinking water",
      "Checking social media every 2 minutes while studying",
      "Eating tomatoes before every test"
    ],
    correctIndex: 0,
    explanation: "Short, intense bursts of 25-minute focus keep your prefrontal cortex energized while structured breaks recharge your mental stamina.",
    mindsetInsight: "Pacing your mental sprints prevents mental burnout.",
    citations: [{ title: "The Pomodoro Technique", uri: "https://en.wikipedia.org/wiki/Pomodoro_Technique" }]
  },

  // Category: Stoic Mindset & Life Lessons
  {
    id: "fb-sm-1",
    category: "Stoic Mindset & Life Lessons",
    difficulty: "Pro",
    question: "Ancient Stoic philosophers like Marcus Aurelius talked about the 'Dichotomy of Control'. What does that actually mean in plain English?",
    options: [
      "Trying to control everything and everyone around you 24/7",
      "Focusing 100% on your own actions, effort, and attitude, while letting go of what you can't control",
      "Bottling up every single emotion and pretending you have no feelings",
      "Overthinking every single worst-case scenario before doing anything"
    ],
    correctIndex: 1,
    explanation: "Real confidence and calm come from putting all your energy into how you choose to react, instead of stressing over external things you can't change.",
    mindsetInsight: "Stop stressing about what you can't control. Put all your energy into your next move.",
    citations: [{ title: "Enchiridion of Epictetus", uri: "https://en.wikipedia.org/wiki/Enchiridion_of_Epictetus" }]
  },
  {
    id: "fb-sm-2",
    category: "Stoic Mindset & Life Lessons",
    difficulty: "Expert",
    question: "What does the Latin Stoic phrase 'Amor Fati' translate to, popularized by philosophers and thinkers?",
    options: [
      "Love of Fate (embracing everything that happens, good or bad, as fuel for growth)",
      "Fear of Failure",
      "Living in the past",
      "Running away from challenges"
    ],
    correctIndex: 0,
    explanation: "Amor Fati isn't just tolerating tough situations—it means actively using every setback as an opportunity to practice resilience and wisdom.",
    mindsetInsight: "Whatever gets in the way becomes the way forward.",
    citations: [{ title: "Meditations by Marcus Aurelius", uri: "https://en.wikipedia.org/wiki/Amor_fati" }]
  },

  // Category: Tech, AI & Future Trends
  {
    id: "fb-tech-1",
    category: "Tech, AI & Future Trends",
    difficulty: "Rookie",
    question: "What major AI breakthrough in 2017 allowed modern models like Gemini to understand entire conversations so naturally?",
    options: [
      "The Transformer architecture with Self-Attention",
      "Old-school punch cards from the 1960s",
      "Basic spell-checking dictionaries",
      "Random coin-flip generators"
    ],
    correctIndex: 0,
    explanation: "The Transformer architecture allowed computers to look at all words in a sentence at the exact same time, understanding context way faster.",
    mindsetInsight: "Connecting different ideas all at once is what leads to big breakthrough moments.",
    citations: [{ title: "Attention Is All You Need (Vaswani et al.)", uri: "https://arxiv.org/abs/1706.03762" }]
  },
  {
    id: "fb-tech-2",
    category: "Tech, AI & Future Trends",
    difficulty: "Pro",
    question: "Smart decision-makers use 'Second-Order Thinking'. What is the big question they ask before making a move?",
    options: [
      "Asking 'What gets me what I want right this second?'",
      "Asking 'And then what?', looking at what happens next after the first result",
      "Asking random chatbots to make all their life choices",
      "Doing the exact same thing twice and hoping for a different result"
    ],
    correctIndex: 1,
    explanation: "First-order thinkers only look at immediate results. Second-order thinkers look at what happens down the road so they don't get surprised.",
    mindsetInsight: "The smartest players think 2 or 3 steps ahead.",
    citations: [{ title: "Second-Order Thinking Mental Model", uri: "https://fs.blog/second-order-thinking/" }]
  },
  {
    id: "fb-tech-3",
    category: "Tech, AI & Future Trends",
    difficulty: "Legend",
    question: "What wild quantum physics phenomenon where two particles stay connected across space was nicknamed 'spooky action at a distance' by Einstein?",
    options: [
      "Quantum Entanglement",
      "Sound waves bouncing off walls",
      "Gravity pulling an apple down",
      "Static electricity on a balloon"
    ],
    correctIndex: 0,
    explanation: "Quantum entanglement means two particles are so linked that whatever happens to one instantly affects the other, even light-years away!",
    mindsetInsight: "Everything in complex systems is more connected than it looks on the surface.",
    citations: [{ title: "Nobel Prize in Physics 2022", uri: "https://www.nobelprize.org/prizes/physics/2022/summary/" }]
  },

  // Category: Atomic Habits & Daily Routines
  {
    id: "fb-habits-1",
    category: "Atomic Habits & Daily Routines",
    difficulty: "Pro",
    question: "In James Clear's bestselling book 'Atomic Habits', what are the 4 simple steps that create every habit loop?",
    options: [
      "Dream, Willpower, Action, Trophy",
      "Cue, Craving, Response, Reward",
      "Trigger, Panic, Repeat, Success",
      "Wish, Hope, Grind, Finish"
    ],
    correctIndex: 1,
    explanation: "Every habit starts with a Cue (what triggers you), a Craving (what you desire), a Response (the action you take), and a Reward (the payoff).",
    mindsetInsight: "You don't rise to your goals; you fall to the level of your daily routines.",
    citations: [{ title: "Atomic Habits", uri: "https://jamesclear.com/atomic-habits" }]
  },
  {
    id: "fb-habits-2",
    category: "Atomic Habits & Daily Routines",
    difficulty: "Rookie",
    question: "What is the '2-Minute Rule' for beating procrastination and starting any tough new habit?",
    options: [
      "Scale down any new habit so that the starting action takes less than 2 minutes to do",
      "Only exercise for 2 minutes a week",
      "Give up if you don't master a skill in 2 minutes",
      "Hit snooze on your alarm every 2 minutes"
    ],
    correctIndex: 0,
    explanation: "Making the first step friction-free (like putting on your running shoes or reading one sentence) overcomes mental resistance immediately.",
    mindsetInsight: "Make starting so ridiculously easy that you can't say no.",
    citations: [{ title: "Atomic Habits: How to Stop Procrastinating", uri: "https://jamesclear.com/how-to-stop-procrastinating" }]
  },
  {
    id: "fb-habits-3",
    category: "Atomic Habits & Daily Routines",
    difficulty: "Pro",
    question: "What is 'Habit Stacking'—one of the easiest ways to lock in a new daily routine?",
    options: [
      "Trying to start 10 brand new habits all on the same morning",
      "Anchoring a new habit directly onto an existing habit you already do automatically every day",
      "Doing habits only on weekends",
      "Stacking up sticky notes on your desk until you feel guilty"
    ],
    correctIndex: 1,
    explanation: "By pairing a new habit with an established trigger (like 'After I pour my morning coffee, I will review my top 3 goals'), your brain adopts it effortlessly.",
    mindsetInsight: "Build bridges from what you already do to what you want to achieve.",
    citations: [{ title: "Habit Stacking: BJ Fogg Tiny Habits", uri: "https://tinyhabits.com" }]
  },

  // Category: Pop Culture & Entertainment
  {
    id: "fb-pop-1",
    category: "Pop Culture & Entertainment",
    difficulty: "Rookie",
    question: "Which animated movie taught millions of viewers about emotional intelligence and how sadness helps us heal?",
    options: [
      "Inside Out",
      "Cars 2",
      "Minions",
      "Shrek 3"
    ],
    correctIndex: 0,
    explanation: "Pixar consulted top psychologists to show how Sadness and Joy work together to build emotional resilience and empathy.",
    mindsetInsight: "Acknowledging tough emotions is the first step toward overcoming them.",
    citations: [{ title: "Inside Out (film)", uri: "https://en.wikipedia.org/wiki/Inside_Out_(2015_film)" }]
  },
  {
    id: "fb-pop-2",
    category: "Pop Culture & Entertainment",
    difficulty: "Pro",
    question: "In the Marvel Cinematic Universe, what famous phrase does Spider-Man live by that highlights personal responsibility?",
    options: [
      "With great power comes great responsibility",
      "I can do this all day",
      "I am Iron Man",
      "Smash everything in sight"
    ],
    correctIndex: 0,
    explanation: "Uncle Ben's timeless quote reminds us that our abilities and privileges come with an obligation to help others.",
    mindsetInsight: "Take ownership of your talents and use them to lift others up.",
    citations: [{ title: "With great power comes great responsibility", uri: "https://en.wikipedia.org/wiki/With_great_power_comes_great_responsibility" }]
  },
  {
    id: "fb-pop-3",
    category: "Pop Culture & Entertainment",
    difficulty: "Expert",
    question: "Which iconic musician said: 'I've failed over and over and over again in my life. And that is why I succeed'?",
    options: [
      "Michael Jordan",
      "Steve Jobs",
      "Freddie Mercury",
      "Thomas Edison"
    ],
    correctIndex: 0,
    explanation: "Michael Jordan famously highlighted that his 9,000 missed shots and 26 missed game-winning shots were the exact fuel that made him a 6-time champion.",
    mindsetInsight: "Every miss is just a rehearsal for your game-winning shot.",
    citations: [{ title: "Michael Jordan 'Failure' Quote", uri: "https://en.wikipedia.org/wiki/Michael_Jordan" }]
  },

  // Category: History & World Cultures
  {
    id: "fb-hist-1",
    category: "History & World Cultures",
    difficulty: "Pro",
    question: "What ancient wonder of the world served as the world's premier center of learning and scientific discovery in antiquity?",
    options: [
      "The Library of Alexandria",
      "The Colosseum of Rome",
      "The Eiffel Tower",
      "Stonehenge"
    ],
    correctIndex: 0,
    explanation: "The Library of Alexandria gathered scholars, mathematicians, and poets from across Africa, Asia, and Europe to share ideas.",
    mindsetInsight: "Knowledge compounds when curious minds share what they discover.",
    citations: [{ title: "Library of Alexandria", uri: "https://en.wikipedia.org/wiki/Library_of_Alexandria" }]
  },
  {
    id: "fb-hist-2",
    category: "History & World Cultures",
    difficulty: "Expert",
    question: "What Japanese philosophy involves repairing broken pottery with gold lacquer, celebrating imperfections as part of history?",
    options: [
      "Kintsugi",
      "Kaizen",
      "Ikigai",
      "Origami"
    ],
    correctIndex: 0,
    explanation: "Kintsugi treats breakage and repair as part of the object's history and beauty, rather than something to disguise.",
    mindsetInsight: "Your scars and setbacks make your story richer and more resilient.",
    citations: [{ title: "Kintsugi Philosophy", uri: "https://en.wikipedia.org/wiki/Kintsugi" }]
  },

  // Category: Science, Nature & Space
  {
    id: "fb-sci-1",
    category: "Science, Nature & Space",
    difficulty: "Pro",
    question: "What is the fastest thing in the known universe, traveling at approximately 300,000 kilometers per second?",
    options: [
      "Light in a vacuum",
      "Sound waves in air",
      "A supersonic jet",
      "A lightning bolt"
    ],
    correctIndex: 0,
    explanation: "The speed of light (c) is the universal cosmic speed limit for all matter and information in physics.",
    mindsetInsight: "Even the fastest journey begins with a single photon.",
    citations: [{ title: "Speed of Light", uri: "https://en.wikipedia.org/wiki/Speed_of_light" }]
  },
  {
    id: "fb-sci-2",
    category: "Science, Nature & Space",
    difficulty: "Legend",
    question: "What telescope launched in 2021 can see deep into infrared light to capture the earliest galaxies formed after the Big Bang?",
    options: [
      "James Webb Space Telescope (JWST)",
      "Hubble Space Telescope",
      "Galileo's Spyglass",
      "Kepler Space Observatory"
    ],
    correctIndex: 0,
    explanation: "JWST's massive gold-plated mirrors peer over 13.5 billion years into the past, revolutionizing astrophysics.",
    mindsetInsight: "The right tools allow you to see what was once completely invisible.",
    citations: [{ title: "James Webb Space Telescope", uri: "https://en.wikipedia.org/wiki/James_Webb_Space_Telescope" }]
  },

  // Category: Mixed Bag / General Brain Power
  {
    id: "fb-mix-1",
    category: "Mixed Bag (The All-Rounder)",
    difficulty: "Pro",
    question: "What is the 'Feynman Technique' for truly mastering any complex concept?",
    options: [
      "Memorizing complex textbook words without understanding what they mean",
      "Explaining the concept in simple words as if teaching it to a 10-year-old to find your own knowledge gaps",
      "Reading the same chapter 50 times in a row",
      "Pretending you know the answer during meetings"
    ],
    correctIndex: 1,
    explanation: "Nobel physicist Richard Feynman proved that if you can't explain an idea simply without fancy jargon, you don't truly understand it yet.",
    mindsetInsight: "Simplicity is the ultimate sign of true mastery.",
    citations: [{ title: "The Feynman Learning Technique", uri: "https://fs.blog/feynman-technique/" }]
  },
  {
    id: "fb-mix-2",
    category: "Mixed Bag (The All-Rounder)",
    difficulty: "Expert",
    question: "What is the 'Pareto Principle' (the 80/20 Rule) often used by peak performers to maximize productivity?",
    options: [
      "Roughly 80% of your best results come from 20% of your highest-leverage actions",
      "You should work 80 hours a week and rest for 20 minutes",
      "80% of people will agree with everything you say",
      "Save 80% of your money and spend 20% on trivia tickets"
    ],
    correctIndex: 0,
    explanation: "Finding the 20% of actions, skills, or habits that drive 80% of your outcomes gives you massive leverage with less wasted energy.",
    mindsetInsight: "Focus on the vital few, not the trivial many.",
    citations: [{ title: "Vilfredo Pareto & The 80/20 Rule", uri: "https://en.wikipedia.org/wiki/Pareto_principle" }]
  },
  {
    id: "fb-mix-3",
    category: "Mixed Bag (The All-Rounder)",
    difficulty: "Rookie",
    question: "What is the term for the psychological boost you get from checking off small items on your daily to-do list?",
    options: [
      "The Dopamine Completion Effect",
      "The Confusion Trap",
      "The Sleepy Brain Effect",
      "The Memory Glitch"
    ],
    correctIndex: 0,
    explanation: "Completing small, manageable tasks triggers a micro-dose of dopamine that builds positive momentum for bigger challenges.",
    mindsetInsight: "Stack quick wins early in the day to build unstoppable momentum.",
    citations: [{ title: "The Progress Principle", uri: "https://hbr.org/2011/05/the-power-of-small-wins" }]
  }
];

// Helper to filter and shuffle fallback questions by category
function getFallbackQuestionsForCategory(category: string, _difficulty?: string, count = 6) {
  const normCategory = (category || "").toLowerCase();
  
  let matching = FALLBACK_QUESTIONS.filter(q => {
    const qCat = q.category.toLowerCase();
    if (normCategory.includes("growth") || normCategory.includes("mindset") || normCategory.includes("brain")) {
      return qCat.includes("growth") || qCat.includes("brain") || qCat.includes("neuro");
    }
    if (normCategory.includes("neuro") || normCategory.includes("focus")) {
      return qCat.includes("neuro") || qCat.includes("focus") || qCat.includes("brain");
    }
    if (normCategory.includes("stoic") || normCategory.includes("life") || normCategory.includes("philosophy")) {
      return qCat.includes("stoic") || qCat.includes("life") || qCat.includes("habits");
    }
    if (normCategory.includes("tech") || normCategory.includes("ai") || normCategory.includes("future")) {
      return qCat.includes("tech") || qCat.includes("ai") || qCat.includes("science");
    }
    if (normCategory.includes("habit") || normCategory.includes("routine") || normCategory.includes("atomic")) {
      return qCat.includes("habit") || qCat.includes("routine") || qCat.includes("growth");
    }
    if (normCategory.includes("pop") || normCategory.includes("culture") || normCategory.includes("entertainment") || normCategory.includes("movie")) {
      return qCat.includes("pop") || qCat.includes("culture") || qCat.includes("entertainment");
    }
    if (normCategory.includes("hist") || normCategory.includes("culture") || normCategory.includes("world")) {
      return qCat.includes("hist") || qCat.includes("world") || qCat.includes("stoic");
    }
    if (normCategory.includes("sci") || normCategory.includes("space") || normCategory.includes("nature")) {
      return qCat.includes("sci") || qCat.includes("nature") || qCat.includes("tech");
    }
    return true;
  });

  if (matching.length < count) {
    // Fill remaining with other random fallback questions
    const remaining = FALLBACK_QUESTIONS.filter(q => !matching.some(m => m.id === q.id));
    matching = [...matching, ...remaining];
  }

  // Shuffle and take count
  const shuffled = [...matching].sort(() => 0.5 - Math.random()).slice(0, count);
  return shuffled.map((q, idx) => ({
    ...q,
    id: `curated-${Date.now()}-${idx}`
  }));
}

// Endpoint: Generate dynamic search-grounded trivia questions with ultra-fast caching & pool warming
app.post("/api/generate-questions", async (req: Request, res: Response) => {
  const { category = "Mixed Bag (The All-Rounder)", difficulty = "Pro", count = 6, personality = "Nova" } = req.body;
  const numCount = Math.max(3, Math.min(15, Number(count) || 6));
  const cacheKey = getCacheKey(category, difficulty);
  const now = Date.now();

  // 1. Check in-memory pool cache for instant (<5ms) round launch
  const cached = QUESTION_POOL_CACHE.get(cacheKey);
  if (cached && (now - cached.timestamp < CACHE_TTL_MS) && cached.questions.length >= numCount) {
    // Return shuffled subset with unique session IDs
    const shuffled = [...cached.questions].sort(() => 0.5 - Math.random()).slice(0, numCount);
    const sessionQuestions = shuffled.map((q, idx) => ({
      ...q,
      id: `pool-${Date.now()}-${idx}`
    }));
    return res.json({ questions: sessionQuestions, isFallback: false, fromCache: true });
  }

  // 2. If in rate limit cooldown, serve instant curated questions
  if (now - lastRateLimitTime < RATE_LIMIT_COOLDOWN_MS) {
    const questions = getFallbackQuestionsForCategory(category, difficulty, numCount);
    return res.json({ questions, isFallback: true });
  }

  const ai = getGeminiClient();
  if (!ai) {
    const questions = getFallbackQuestionsForCategory(category, difficulty, numCount);
    return res.json({ questions, isFallback: true });
  }

  // Helper function to generate questions via Gemini
  const generateQuestionsWithAI = async (): Promise<any[]> => {
    const prompt = `You are the lead trivia creator for "Align Trivia Arena" (an ultra-fun, fast-paced live AI trivia game).
Generate ${numCount} punchy, engaging, verified multiple-choice trivia questions written in clear, natural, everyday English that is fun and relatable for young adults.
Category: "${category}"
Target Difficulty: "${difficulty}" (Rookie, Pro, Expert, or Legend)
AI Host tone: "${personality}"

Writing Guidelines:
- Questions must be clear, fun, and easy to understand on first read—avoid stuffy academic textbook jargon.
- Topics can cover: Brain hacks, growth mindset, psychology, modern tech & AI, dopamine & habits, Stoic life lessons, science breakthroughs, and cool facts.
- Provide 4 distinct answer choices where only 1 is correct.
- Explanation: 1-2 sentences explaining why the right answer is correct in simple, interesting language.
- Mindset Insight: 1 snappy, memorable takeaway or life hack quote (max 15 words).
- All facts must be 100% accurate and verified.`;

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          category: { type: Type.STRING },
          difficulty: { type: Type.STRING },
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Array of exactly 4 choices."
          },
          correctIndex: { type: Type.INTEGER, description: "0-indexed position (0, 1, 2, or 3) of the correct answer." },
          explanation: { type: Type.STRING },
          mindsetInsight: { type: Type.STRING },
        },
        required: ["id", "category", "difficulty", "question", "options", "correctIndex", "explanation", "mindsetInsight"]
      }
    };

    // Use fast gemini-3.1-flash-lite first for sub-second generation
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.7,
        }
      });
      const parsed = JSON.parse(response?.text || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (liteErr: any) {
      const errMsg = liteErr?.message || String(liteErr);
      if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
        lastRateLimitTime = Date.now();
        throw liteErr;
      }
    }

    // Secondary fallback model: gemini-3.7-flash
    const response37 = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });
    return JSON.parse(response37?.text || "[]");
  };

  // 3. Strict 2.8s Race Timeout to ensure users NEVER experience hanging load screens
  const timeoutPromise = new Promise<{ isTimeout: true }>((resolve) => {
    setTimeout(() => resolve({ isTimeout: true }), 2800);
  });

  try {
    const raceResult = await Promise.race([generateQuestionsWithAI(), timeoutPromise]);

    if ((raceResult as any)?.isTimeout) {
      console.info(`[FastLaunch] AI question generation hit 2.8s race limit for "${category}". Serving instant curated fallback and warming pool in background.`);
      // Background promise continues to populate cache when it resolves
      generateQuestionsWithAI()
        .then((aiQuestions) => {
          if (Array.isArray(aiQuestions) && aiQuestions.length > 0) {
            QUESTION_POOL_CACHE.set(cacheKey, {
              timestamp: Date.now(),
              questions: aiQuestions
            });
          }
        })
        .catch(() => {});

      const fallbackQuestions = getFallbackQuestionsForCategory(category, difficulty, numCount);
      return res.json({ questions: fallbackQuestions, isFallback: true });
    }

    const aiQuestions = raceResult as any[];
    if (Array.isArray(aiQuestions) && aiQuestions.length > 0) {
      // Save to in-memory question pool
      QUESTION_POOL_CACHE.set(cacheKey, {
        timestamp: Date.now(),
        questions: aiQuestions
      });

      const enhanced = aiQuestions.slice(0, numCount).map((q: any, idx: number) => ({
        ...q,
        id: q.id || `gen-${Date.now()}-${idx}`
      }));
      return res.json({ questions: enhanced, isFallback: false });
    }

    const fallbackQuestions = getFallbackQuestionsForCategory(category, difficulty, numCount);
    res.json({ questions: fallbackQuestions, isFallback: true });
  } catch {
    const questions = getFallbackQuestionsForCategory(category, difficulty, numCount);
    res.json({ questions, isFallback: true });
  }
});

// Persona fallback commentary map
const PERSONA_FALLBACKS: Record<string, Record<string, (player: string, streak: number, score: number, correct: string, lifeline: string) => string>> = {
  Nova: {
    correct: (player, streak) => `LET'S GO, ${player}! Clean hit and your streak is on fire at ${streak}!`,
    incorrect: (player, _s, _sc, correct) => `Ah, close one! But champions use misses to lock in for next time. The answer was "${correct}". Dust off and let's bounce back!`,
    streak: (player, streak) => `UNSTOPPABLE! ${streak} in a row, ${player}! You're dominating the arena!`,
    lifeline: (player, _s, _sc, _c, lifeline) => `Smart move pulling the ${lifeline}! Great game sense, ${player}!`,
    intro: (player) => `Welcome to the arena, ${player}! I'm Nova, and we are about to light up that scoreboard!`,
    gameover: (player, _s, score) => `GG, ${player}! You crushed it with ${score} points. Pure big brain energy!`,
    timeout: (player, _s, _sc, correct) => `Time's up! The pick was "${correct}". Speed it up on the next one, let's go!`
  },
  "Dr. Thaddeus": {
    correct: (player) => `Look at you, ${player}. Actually correct. Your neurons are surprisingly on point today.`,
    incorrect: (_p, _s, _sc, correct) => `A minor glitch in your logic. The actual answer was "${correct}". Don't worry, even geniuses take an occasional L.`,
    streak: (player, streak) => `${streak} in a row? Alright ${player}, you officially have my respect, scholar.`,
    lifeline: (_p, _s, _sc, _c, lifeline) => `Using ${lifeline}? Smart people know when to ask for help.`,
    intro: (player) => `Greetings, ${player}. I'm Dr. Thaddeus. Let's see if your trivia skills can impress me today.`,
    gameover: (player, _s, score) => `Round complete: ${score} points. Honestly ${player}, not bad at all!`,
    timeout: (_p, _s, _sc, correct) => `Hesitation is the enemy of knowledge. The answer was "${correct}".`
  },
  Aria: {
    correct: (player) => `Beautiful focus, ${player}! That answer was pure clarity.`,
    incorrect: (_p, _s, _sc, correct) => `Take a breath! The right answer was "${correct}". Every mistake is just a free lesson making your brain sharper.`,
    streak: (player, streak) => `You're in the flow state, ${player}! ${streak} in a row. Keep riding this wave.`,
    lifeline: (_p, _s, _sc, _c, lifeline) => `Great call using ${lifeline}. Using your tools is how we grow.`,
    intro: (player) => `Hey ${player}! I'm Aria. Let's have fun, learn some cool facts, and level up your brain.`,
    gameover: (player, _s, score) => `What a wonderful round! You earned ${score} points and picked up great insights.`,
    timeout: (_p, _s, _sc, correct) => `Time slipped away! The answer was "${correct}". Refocus and take on the next one.`
  },
  "Cipher-9": {
    correct: (_p, streak) => `[SYSTEM OK] Answer confirmed! Multiplier running at streak level ${streak}.`,
    incorrect: (_p, _s, _sc, correct) => `[GLITCH DETECTED] Target answer was "${correct}". Recalibrating logic matrix... next question loaded.`,
    streak: (_p, streak) => `[OVERCLOCK 100%] Streak ${streak}x active! You're computing at lightspeed.`,
    lifeline: (_p, _s, _sc, _c, lifeline) => `[UTILITY ACTIVATED: ${lifeline}] Data assist granted.`,
    intro: (player) => `System online. I am Cipher-9. Show me how fast your brain can process data, ${player}.`,
    gameover: (player, _s, score) => `[SESSION LOGGED] Score recorded: ${score} points for ${player}. Great run.`,
    timeout: (_p, _s, _sc, correct) => `[TIMEOUT] Response window expired. Answer was "${correct}".`
  },
  "Coach Marcus": {
    correct: (_p, streak) => `YES! That's what I'm talking about! ${streak} in a row, keep your foot on the gas!`,
    incorrect: (player, _s, _sc, correct) => `Heads up, ${player}! The pick was "${correct}". Champions don't look back—reset and attack the next question!`,
    streak: (_p, streak) => `BEAST MODE! That's ${streak} straight! You're on fire right now!`,
    lifeline: (_p, _s, _sc, _c, lifeline) => `Great tactical call with ${lifeline}! That's veteran game IQ!`,
    intro: (player) => `Let's go, ${player}! Coach Marcus here. Bring the energy and let's stack some wins!`,
    gameover: (player, _s, score) => `Great hustle today! Finished strong with ${score} points. Proud of the effort!`,
    timeout: (player, _s, _sc, correct) => `Clock ran out on us, ${player}! The answer was "${correct}". Quick rebound on the next one!`
  }
};

function getFallbackCommentary(personality: string, eventType: string, player: string, streak: number, score: number, correct: string, lifeline: string): string {
  const hostMap = PERSONA_FALLBACKS[personality] || PERSONA_FALLBACKS["Nova"];
  const fn = hostMap[eventType] || hostMap["correct"];
  return fn(player, streak, score, correct, lifeline);
}

// Endpoint: AI Host dynamic live commentary and reaction
app.post("/api/host-commentary", async (req: Request, res: Response) => {
  const {
    personality = "Nova",
    eventType = "correct", // "intro", "correct", "incorrect", "streak", "lifeline", "gameover", "timeout"
    playerName = "Champion",
    score = 0,
    streak = 0,
    currentQuestion = "",
    selectedAnswer = "",
    correctAnswer = "",
    lifelineUsed = "",
    userQuery = ""
  } = req.body;

  const ai = getGeminiClient();
  if (!ai) {
    const text = getFallbackCommentary(personality, eventType, playerName, streak, score, correctAnswer, lifelineUsed);
    return res.json({ commentary: text, personality, voiceName: getVoiceForPersonality(personality) });
  }

  const hostPersonaDescriptions: Record<string, string> = {
    Nova: "Super energetic, hype, fun game-show champion host who talks like an excited streamer cheering on the player.",
    "Dr. Thaddeus": "Witty, sarcastic professor with clever dry humor, playful roasts when you miss, and high praise when you nail hard questions.",
    Aria: "Chill, zen, uplifting mindset guru who makes learning fun and reminds you that mistakes are just level-ups.",
    "Cipher-9": "Rogue cyberpunk AI who speaks in fast sci-fi hacker slang and calculates your speed in milliseconds.",
    "Coach Marcus": "High-intensity hype coach with locker-room energy, all about hustle, streaks, and clutching under pressure."
  };

  const hostPrompt = `You are "${personality}", the AI Host of the Align Trivia Arena.
Your Persona: ${hostPersonaDescriptions[personality] || "Energetic and insightful trivia host"}

Player Name: "${playerName}"
Event: "${eventType}"
Current Score: ${score}
Current Streak: ${streak}
Question Context: "${currentQuestion}"
Selected Answer: "${selectedAnswer}"
Correct Answer: "${correctAnswer}"
Lifeline: "${lifelineUsed}"
User Voice/Query: "${userQuery}"

Provide a brief, snappy, natural, and highly charismatic in-character host line (1-2 sentences max).
Use clean, engaging, modern English that sounds great when spoken aloud. Never break character. Address the player directly.`;

  let commentary = "";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: hostPrompt,
    });
    commentary = response.text?.trim() || "";
  } catch (primaryErr: any) {
    // Graceful fallback to gemini-3.1-flash-lite on 503 high demand or 429 rate limit
    try {
      const liteResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: hostPrompt,
      });
      commentary = liteResponse.text?.trim() || "";
    } catch {
      commentary = getFallbackCommentary(personality, eventType, playerName, streak, score, correctAnswer, lifelineUsed);
    }
  }

  if (!commentary) {
    commentary = getFallbackCommentary(personality, eventType, playerName, streak, score, correctAnswer, lifelineUsed);
  }

  res.json({
    commentary,
    personality,
    voiceName: getVoiceForPersonality(personality)
  });
});

// Helper for host voice mapping
function getVoiceForPersonality(personality: string): string {
  switch (personality) {
    case "Dr. Thaddeus":
      return "Fenrir";
    case "Aria":
      return "Kore";
    case "Cipher-9":
      return "Zephyr";
    case "Coach Marcus":
      return "Charon";
    case "Nova":
    default:
      return "Puck";
  }
}

// Endpoint: Text to Speech with gemini-3.1-flash-tts-preview
app.post("/api/tts", async (req: Request, res: Response) => {
  try {
    const { text, voice = "Puck", personality } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text string is required" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Inform client to use Web Speech API fallback
      return res.json({ useWebSpeechFallback: true, text });
    }

    const resolvedVoice = personality ? getVoiceForPersonality(personality) : voice;

    // Use gemini-3.1-flash-tts-preview as mandated
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: text.slice(0, 400) }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: resolvedVoice },
          },
        },
      },
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const mimeType = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || "audio/pcm;rate=24000";

    if (audioBase64) {
      return res.json({
        audioBase64,
        mimeType,
        voiceName: resolvedVoice,
        text
      });
    }

    return res.json({ useWebSpeechFallback: true, text });
  } catch (_error: any) {
    // Return fallback indicator cleanly so client speaks with Web Speech API
    res.json({ useWebSpeechFallback: true, text: req.body?.text || "" });
  }
});

// Endpoint: Voice Mindset Hint / Host Banter
app.post("/api/host-hint", async (req: Request, res: Response) => {
  const { personality = "Nova", question, options, playerPrompt = "Give me a hint!" } = req.body;
  const ai = getGeminiClient();

  if (!ai) {
    return res.json({
      hint: `Look for the choice that focuses on learning from mistakes and taking small daily actions!`,
      personality
    });
  }

  const prompt = `You are "${personality}", the AI Trivia Host.
The player asked: "${playerPrompt}".
The current question is: "${question}"
Choices: ${JSON.stringify(options)}

Rules:
- Give a clever, fun, in-character clue or hint in simple everyday English WITHOUT directly spoiling the exact answer.
- Keep it short and punchy (1-2 sentences).
- Stay in your distinctive personality.`;

  let hint = "";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
    });
    hint = response.text?.trim() || "";
  } catch {
    try {
      const liteResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
      });
      hint = liteResponse.text?.trim() || "";
    } catch {
      hint = "Think about which option helps your brain build long-term systems and learn from the process!";
    }
  }

  res.json({
    hint: hint || "Think about which option helps your brain build long-term systems and learn from the process!",
    personality
  });
});

// Endpoint: Social Hub Daily Discussion Synthesis
app.post("/api/discussion-synthesis", async (req: Request, res: Response) => {
  try {
    const { promptTopic, posts } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        synthesis: "The community agrees that treating mistakes like free data instead of losses is the fastest way to get smarter and stay confident under pressure.",
        keyTakeaway: "Making mistakes is just part of the process—what matters is learning the lesson and keeping your momentum."
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `You are the AI Host in the Community Hub for the Align Trivia Arena.
Topic: "${promptTopic}"
Player Comments: ${JSON.stringify(posts)}

Write a super clear, inspiring 2-sentence summary of what people are saying, plus 1 snappy takeaway quote that anyone can apply today. Keep it conversational and relatable.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            synthesis: { type: Type.STRING },
            keyTakeaway: { type: Type.STRING }
          },
          required: ["synthesis", "keyTakeaway"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    res.json({
      synthesis: "Everyone in the chat agrees that building small daily habits and celebrating quick wins is the best way to level up.",
      keyTakeaway: "Stack small wins every single day."
    });
  }
});

// WebSocket Server for Gemini Live API Voice Conversations (gemini-3.1-flash-live-preview)
const wss = new WebSocketServer({ server, path: "/ws/live" });

wss.on("connection", async (clientWs: WebSocket) => {
  console.log("Client connected to Live Voice WebSocket");
  const ai = getGeminiClient();

  let liveSession: any = null;

  if (ai) {
    try {
      liveSession = await (ai.live as any).connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
          },
          systemInstruction: "You are the lively, fun, and sharp AI Host of the Align Trivia Arena. You chat with players, give smart hints, celebrate their right answers, and keep the energy high and positive in plain, engaging English.",
        },
      });

      // Stream audio responses from Gemini Live API back to frontend client
      (async () => {
        try {
          for await (const message of liveSession.receive()) {
            if (clientWs.readyState === WebSocket.OPEN) {
              const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioData) {
                clientWs.send(JSON.stringify({ type: "audio", data: audioData }));
              }
              const textData = message.serverContent?.modelTurn?.parts?.[0]?.text;
              if (textData) {
                clientWs.send(JSON.stringify({ type: "text", text: textData }));
              }
            }
          }
        } catch (streamErr) {
          console.warn("Live session stream error:", streamErr);
        }
      })();
    } catch (liveErr) {
      console.warn("Failed to connect Gemini Live API session:", liveErr);
      clientWs.send(JSON.stringify({ type: "fallback_notice", message: "Live Web Speech mode active." }));
    }
  }

  // Handle incoming audio chunks or text from client
  clientWs.on("message", async (data: Buffer | string) => {
    try {
      const parsed = JSON.parse(data.toString());
      if (parsed.type === "realtime_input" && liveSession) {
        await liveSession.send({
          realtimeInput: {
            mediaChunks: [
              {
                mimeType: parsed.mimeType || "audio/pcm;rate=16000",
                data: parsed.data,
              },
            ],
          },
        });
      } else if (parsed.type === "text_prompt" && liveSession) {
        await liveSession.send({
          clientContent: {
            turns: [
              {
                role: "user",
                parts: [{ text: parsed.text }],
              },
            ],
            turnComplete: true,
          },
        });
      }
    } catch (e) {
      // Audio binary or other stream
    }
  });

  clientWs.on("close", () => {
    if (liveSession) {
      try {
        liveSession.close();
      } catch (err) {
        // ignore
      }
    }
  });
});

// Vite middleware for development vs production static serve
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Align Trivia Server running on http://localhost:${PORT}`);
  });
}

startServer();
