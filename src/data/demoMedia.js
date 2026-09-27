import { Send, LayoutGrid } from 'lucide-react';

// Real demo recordings, shared by AgentsLive.jsx and AIAgentMastery.jsx —
// both pages describe building an agent connected to real messaging
// channels plus a multi-agent dashboard, so the same two clips carry that
// weight on both pages, per founder direction to never name the underlying
// tools/frameworks.
export const DEMO_VIDEO = {
  title: 'Your agent, live on Telegram',
  text: 'Message it like you would a person — it reads, decides, and replies, connected to the tools you gave it.',
  icon: Send,
  src: '/videos/agents-live-telegram-demo.mp4',
};

export const DEMO_LOOP = {
  title: 'The multi-agent dashboard',
  text: 'Several agents on one board, each with its own job, working a shared task list the way a small team would.',
  icon: LayoutGrid,
  src: '/videos/agents-live-dashboard-demo.mp4',
};
