// Single source of truth for every publicly-crawlable route — kept in sync
// with public/sitemap.xml. Hardcoded rather than imported from src/data/
// agents.js because that file (and its own imports) rely on Vite's
// extension-less module resolution, which plain Node's ESM loader (this
// script runs under, not Vite) doesn't support. Private/authenticated
// routes (dashboard, admin, certificates, verify) are deliberately
// excluded — they gate on auth client-side anyway, nothing worth indexing.
const builder1Slugs = [
  'gmail-ai-triage-agent',
  'whatsapp-auto-reply-bot',
  'slack-morning-briefing-bot',
  'daily-news-industry-summary-agent',
  'meeting-notes-formatter-agent',
  'simple-faq-chatbot',
  'social-media-post-generator',
  'document-summarizer-agent',
  'lead-capture-qualifier-bot',
  'price-competitor-monitor-agent',
  'calendar-task-prioritizer-agent',
  'basic-data-extractor-agent',
];

const builder2Slugs = [
  'web-research-agent',
  'crm-lead-follow-up-agent',
  'linkedin-content-creator-agent',
  'customer-support-rag-bot',
  'invoice-processing-agent',
  'competitor-intelligence-monitor',
  'code-review-agent',
  'hr-recruitment-screening-agent',
  'seo-content-writer-agent',
  'financial-reporting-agent',
  'contract-clause-extractor',
  'product-recommendation-engine',
  'sales-email-personalization-agent',
];

export const routes = [
  '/',
  '/catalog',
  '/paths',
  '/pricing',
  '/welcome',
  '/about',
  '/faq',
  '/whatsapp-bot-guide',
  '/ai-builder',
  '/vibe-coding',
  '/ai-agent-mastery',
  '/builder-1-guide',
  '/session/build-real-product',
  '/session/daily-news-agent',
  '/legal/terms',
  '/legal/privacy',
  ...builder1Slugs.map((slug) => `/builder-1/${slug}`),
  ...builder2Slugs.map((slug) => `/builder-2/${slug}`),
];
