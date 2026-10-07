import {
  Banknote, Bot, Brain, Briefcase, Calculator, CalendarDays, ChartColumn, CircleCheck, Clapperboard, CodeXml,
  Compass, Construction, Contact, Factory, FileText, FlaskConical, Folder, Globe, GraduationCap, Hammer, Hand,
  Handshake, Headphones, KeyRound, Landmark, Mail, Megaphone, MessageSquare, Microscope, Mic, Monitor, Network,
  NotebookPen, Newspaper, Package, PartyPopper, Phone, Puzzle, Radio, Receipt, RefreshCw, Rocket, Satellite, Scale,
  School, ScrollText, Search, Settings, Siren, Smartphone, Sparkles, Sprout, Store, Sun, Target, TrendingUp, Trophy,
  User, UserRound, Users, Video, Wrench, Zap,
} from 'lucide-react';

// Every emoji the app used as an icon, mapped to one Lucide icon (one set, one
// stroke weight — index.css pins .lucide to 1.75px). The data files keep their
// emoji (they also feed share text and social posts); this is the UI layer.
// An emoji with no entry — e.g. one an admin typed into a guide — renders as
// the text it is, so nothing disappears.
const MAP = {
  '🌱': Sprout, '⚡': Zap, '🚀': Rocket, '🤖': Bot, '📅': CalendarDays, '🗓': CalendarDays, '🏆': Trophy,
  '🎓': GraduationCap, '📈': TrendingUp, '📢': Megaphone, '🕵': Search, '📝': NotebookPen, '🔍': Search,
  '🎯': Target, '💼': Briefcase, '📊': ChartColumn, '⚖': Scale, '🌐': Globe, '⚙': Settings, '💰': Banknote,
  '🎉': PartyPopper, '🏪': Store, '👩': UserRound, '🏫': School, '👩‍🏫': School, '🧩': Puzzle, '🔄': RefreshCw,
  '🕸': Network, '📞': Phone, '📦': Package, '🛠': Wrench, '🤝': Handshake, '🧪': FlaskConical, '📰': Newspaper,
  '📱': Smartphone, '🧮': Calculator, '☀': Sun, '📧': Mail, '✉': Mail, '📄': FileText, '💬': MessageSquare,
  '📜': ScrollText, '🧾': Receipt, '🧑': User, '📇': Contact, '🔬': Microscope, '📡': Radio, '🛰': Satellite,
  '🚨': Siren, '🏭': Factory, '🧠': Brain, '🏗': Construction, '👥': Users, '🎧': Headphones, '💻': CodeXml,
  '🧭': Compass, '🔨': Hammer, '🏛': Landmark, '✅': CircleCheck, '✨': Sparkles, '🔑': KeyRound, '🖥': Monitor,
  '🎙': Mic, '📁': Folder, '🎬': Clapperboard, '🙋': Hand, '🎥': Video, '👋': Hand,
};

const strip = (e) => (e || '').replace(/️/g, '');

export default function EmojiIcon({ emoji, className = 'w-5 h-5', ...rest }) {
  const Icon = MAP[strip(emoji)];
  if (!Icon) return <span aria-hidden="true">{emoji}</span>;
  return <Icon className={className} aria-hidden="true" {...rest} />;
}

const keys = Object.keys(MAP).sort((a, b) => b.length - a.length);
const SPLIT = new RegExp(`(${keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\uFE0F?`, 'u');

// "🌱 Builder 1" -> an icon, then the text. Strings only; anything else passes through.
export function EmojiText({ children, iconClassName = 'w-[1.05em] h-[1.05em] inline-block align-[-0.15em]' }) {
  if (typeof children !== 'string') return children;
  const parts = children.split(SPLIT);
  return parts.map((part, i) => (i % 2 === 1
    ? <EmojiIcon key={i} emoji={part} className={iconClassName} />
    : part));
}
