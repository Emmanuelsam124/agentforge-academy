import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Globe, GraduationCap, ListChecks, Rocket, Wallet } from 'lucide-react';

// The six projects, names and descriptions copied from VibeCoding.jsx's
// PROJECTS. Keep the two in step if the bootcamp changes.
const PROJECTS = [
  { icon: Globe, name: 'Personal Portfolio Website', text: 'A professional responsive website showcasing your skills, projects, and experience.' },
  { icon: ListChecks, name: 'Interactive To-Do App', text: 'Tasks, editing, deletion, completion, and real user interaction.' },
  { icon: Wallet, name: 'Expense Tracker', text: 'Recording expenses, categories, dates, and spending totals.' },
  { icon: GraduationCap, name: 'Student Management System', text: 'A real database-connected application using Supabase.' },
  { icon: Bot, name: 'AI-Powered Application', text: 'An AI assistant, content tool, study assistant, or support prototype.' },
  { icon: Rocket, name: 'Your Own Product', text: 'Take an idea of your own and turn it into a working application.' },
];

export default function VibeProjects() {
  return (
    <div className="grid lg:grid-cols-[1fr_2fr] gap-7 lg:gap-14">
      <div className="min-w-0">
        <h2 className="t-h2 text-ink">What you'll build in the Vibe Coding Bootcamp</h2>
        <p className="t-lead text-body mt-3.5 mb-5 lg:mb-7">
          Six projects across 4 weeks and 8 live classes, from your first website to a product of your own.
        </p>
        <Link to="/vibe-coding" className="inline-flex items-center gap-1.5 font-bold text-[15px] text-link hover:underline underline-offset-4">
          See the Vibe Coding Bootcamp <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <ul className="grid sm:grid-cols-2 sm:gap-x-10 list-none m-0 p-0 border-b border-border sm:border-b-0">
        {PROJECTS.map((p) => (
          <li key={p.name} className="flex gap-4 border-t border-border py-[18px] lg:py-[22px] min-w-0">
            <p.icon className="w-6 h-6 flex-shrink-0 mt-0.5 text-link" />
            <div>
              <h3 className="t-h3 text-ink mb-1">{p.name}</h3>
              <p className="t-card text-body">{p.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
