// Beginner Agents (1-12) — metadata only; full guide content lives in Supabase `course_content`
// Ordered simplest -> most advanced (see plan: playful-baking-flask) rather than by id.
//
// week/isMainProject group these into 4 weeks of a live cohort, each week
// sharing a mechanism (not just a topic) rather than a random split:
//   Week 1 — scheduled digests: read a source on a timer, summarize, deliver
//   Week 2 — structuring: messy input in, clean organized output out
//   Week 3 — triage & decisioning: something arrives, classify/score, act
//   Week 4 — outward-facing: talks to or writes for other people
// Each week has exactly one isMainProject:true agent — completing it alone
// earns that week's certificate (see claim_certificate in Supabase); the
// other two agents in the week are optional and don't gate it.
export const agentsBeginner = [
  {
    id: 4,
    week: 1,
    isMainProject: true,
    slug: "daily-news-industry-summary-agent",
    title: "Daily News & Industry Summary Agent",
    emoji: "📰",
    department: [
      "Executive / Strategy",
    ],
    departmentIds: [
      "strategy",
    ],
    difficulty: "Builder 1",
    description: "Build a zero-code automated briefing agent on Make.com — pulls daily headlines via Google News RSS, uses free Gemini AI to write a 5-minute executive summary, and delivers it to your inbox every morning. No Python, no API billing.",
    techStack: [
      "Make.com",
      "Google News RSS",
      "Google AI Studio (Gemini)",
      "Gmail",
    ],
    buildTime: "1 hr",
    xp: 200,
    popularity: 80,
    prerequisites: [
      "Make.com free account",
      "Gmail account",
      "Google AI Studio account (free)",
    ],
    tags: [
      "automation",
      "news",
      "briefing",
      "no-code",
    ],
  },
  {
    id: 7,
    week: 4,
    isMainProject: false,
    slug: "social-media-post-generator",
    title: "Social Media Post Generator",
    emoji: "📱",
    department: [
      "Marketing",
    ],
    departmentIds: [
      "marketing",
    ],
    difficulty: "Builder 1",
    description: "Input a topic, URL, or article → generate 5 platform-optimized posts for LinkedIn, Twitter/X, Instagram, Facebook, and Threads.",
    techStack: [
      "Python",
      "Claude API",
      "Streamlit",
    ],
    buildTime: "1.5 hrs",
    xp: 200,
    popularity: 92,
    prerequisites: [
    ],
    tags: [
      "marketing",
      "content",
      "social-media",
    ],
  },
  {
    id: 12,
    week: 2,
    isMainProject: false,
    slug: "basic-data-extractor-agent",
    title: "Basic Data Extractor Agent",
    emoji: "🧮",
    department: [
      "Data & Analytics",
    ],
    departmentIds: [
      "data",
    ],
    difficulty: "Builder 1",
    description: "Paste unstructured text (emails, PDFs, web pages) and extract structured data — names, dates, numbers, entities — into a clean CSV.",
    techStack: [
      "Python",
      "Claude API",
      "pandas",
    ],
    buildTime: "1.5 hrs",
    xp: 220,
    popularity: 82,
    prerequisites: [
      "Basic pandas familiarity",
    ],
    tags: [
      "data-extraction",
      "automation",
      "csv",
    ],
  },
  {
    id: 5,
    week: 2,
    isMainProject: true,
    slug: "meeting-notes-formatter-agent",
    title: "Meeting Notes Formatter Agent",
    emoji: "📝",
    department: [
      "Operations",
    ],
    departmentIds: [
      "operations",
    ],
    difficulty: "Builder 1",
    description: "Paste a raw meeting transcript or bullet points and get back professional meeting notes with decisions, action items, owners, and deadlines.",
    techStack: [
      "Python",
      "Claude API",
      "Google Docs API",
    ],
    buildTime: "2 hrs",
    xp: 280,
    popularity: 75,
    prerequisites: [
      "Google Cloud account (optional, for Docs export)",
    ],
    tags: [
      "productivity",
      "meetings",
      "documentation",
    ],
  },
  {
    id: 3,
    week: 1,
    isMainProject: false,
    slug: "slack-morning-briefing-bot",
    title: "Slack Morning Briefing Bot",
    emoji: "☀️",
    department: [
      "Operations",
    ],
    departmentIds: [
      "operations",
    ],
    difficulty: "Builder 1",
    description: "A bot that runs every morning at 8am, reads your top Slack channels for the past 24 hours, and sends a prioritized briefing to your DM.",
    techStack: [
      "Python",
      "Slack API",
      "Claude API",
    ],
    buildTime: "2 hrs",
    xp: 250,
    popularity: 88,
    prerequisites: [
      "Slack workspace admin access",
    ],
    tags: [
      "automation",
      "slack",
      "productivity",
    ],
  },
  {
    id: 6,
    week: 4,
    isMainProject: false,
    slug: "simple-faq-chatbot",
    title: "Simple FAQ Chatbot",
    emoji: "🤖",
    department: [
      "Customer Support",
    ],
    departmentIds: [
      "support",
    ],
    difficulty: "Builder 1",
    description: "A web-based chatbot that answers questions from a custom FAQ document you provide — embeddable on any website.",
    techStack: [
      "Python",
      "Claude API",
      "Streamlit",
    ],
    buildTime: "2 hrs",
    xp: 250,
    popularity: 90,
    prerequisites: [
      "Streamlit Cloud account (free)",
    ],
    tags: [
      "chatbot",
      "support",
      "rag-lite",
    ],
  },
  {
    id: 11,
    week: 1,
    isMainProject: false,
    slug: "calendar-task-prioritizer-agent",
    title: "Calendar & Task Prioritizer Agent",
    emoji: "🗓️",
    department: [
      "Operations",
    ],
    departmentIds: [
      "operations",
    ],
    difficulty: "Builder 1",
    description: "Every morning, reads your Google Calendar and Google Tasks, uses Gemini (free) to fit your tasks around your meetings, checks the AI's plan in code, and emails you a clean daily plan. Runs on Google's servers with nothing to install.",
    techStack: [
      "Google Apps Script",
      "Google Calendar",
      "Google Tasks",
      "Gemini API",
    ],
    buildTime: "1 hr",
    xp: 250,
    popularity: 76,
    prerequisites: [
      "A Google account",
    ],
    tags: [
      "productivity",
      "calendar",
      "planning",
    ],
  },
  {
    id: 1,
    week: 3,
    isMainProject: true,
    slug: "gmail-ai-triage-agent",
    title: "Gmail AI Triage Agent",
    emoji: "📧",
    videoId: "ScMzIvxBSi4",
    department: [
      "Operations",
      "Sales",
    ],
    departmentIds: [
      "operations",
      "sales",
    ],
    difficulty: "Builder 1",
    description: "Connects to your Gmail, reads unread emails, classifies them by priority, auto-labels them, and drafts context-aware replies.",
    techStack: [
      "Python",
      "Gmail API",
      "Claude API",
    ],
    buildTime: "2.5 hrs",
    xp: 300,
    popularity: 98,
    prerequisites: [
      "Gmail account",
      "Google Cloud account (free)",
    ],
    tags: [
      "automation",
      "email",
      "productivity",
    ],
  },
  {
    id: 8,
    week: 2,
    isMainProject: false,
    slug: "document-summarizer-agent",
    title: "Document Summarizer Agent",
    emoji: "📄",
    department: [
      "Legal",
      "Operations",
    ],
    departmentIds: [
      "legal",
      "operations",
    ],
    difficulty: "Builder 1",
    description: "Drop any PDF, Word doc, or URL and get an intelligent summary with key points, action items, and a one-paragraph executive brief.",
    techStack: [
      "Python",
      "Claude API",
      "PyPDF2",
    ],
    buildTime: "2 hrs",
    xp: 270,
    popularity: 85,
    prerequisites: [
    ],
    tags: [
      "documents",
      "summarization",
      "productivity",
    ],
  },
  {
    id: 10,
    week: 3,
    isMainProject: false,
    slug: "price-competitor-monitor-agent",
    title: "Price & Competitor Monitor Agent",
    emoji: "🔍",
    department: [
      "Operations",
      "Marketing",
    ],
    departmentIds: [
      "operations",
      "marketing",
    ],
    difficulty: "Builder 1",
    description: "Monitor competitor product pages and pricing — get an email alert when prices change or new products appear.",
    techStack: [
      "Python",
      "requests",
      "Claude API",
    ],
    buildTime: "2.5 hrs",
    xp: 300,
    popularity: 78,
    prerequisites: [
      "Basic HTML/CSS selector knowledge",
    ],
    tags: [
      "competitive-intel",
      "scraping",
      "monitoring",
    ],
  },
  {
    id: 9,
    week: 3,
    isMainProject: false,
    slug: "lead-capture-qualifier-bot",
    title: "Lead Capture & Qualifier Bot",
    emoji: "🎯",
    department: [
      "Sales",
    ],
    departmentIds: [
      "sales",
    ],
    difficulty: "Builder 1",
    description: "Receives new form submissions, scores the lead using Claude, and auto-creates a qualified contact in HubSpot with a lead score and follow-up task.",
    techStack: [
      "Python",
      "Typeform API",
      "Claude API",
      "HubSpot API",
    ],
    buildTime: "3 hrs",
    xp: 320,
    popularity: 87,
    prerequisites: [
      "Typeform account",
      "HubSpot account (free CRM tier works)",
    ],
    tags: [
      "sales",
      "crm",
      "lead-scoring",
    ],
  },
  {
    id: 2,
    week: 4,
    isMainProject: true,
    slug: "whatsapp-auto-reply-bot",
    title: "WhatsApp Auto-Reply Bot",
    emoji: "💬",
    department: [
      "Sales",
      "Customer Support",
    ],
    departmentIds: [
      "sales",
      "support",
    ],
    difficulty: "Builder 1",
    description: "A WhatsApp bot that receives messages, understands intent, and replies in your personal voice 24/7 using a persona file.",
    techStack: [
      "Node.js",
      "Twilio",
      "Claude API",
    ],
    buildTime: "3 hrs",
    xp: 350,
    popularity: 95,
    prerequisites: [
      "Basic JavaScript/Node.js",
      "Twilio account",
      "Personal phone for testing",
    ],
    tags: [
      "automation",
      "messaging",
      "whatsapp",
    ],
  },
];
