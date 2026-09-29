import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, Video, PlayCircle, MessagesSquare, UserCircle2, HelpCircle, LogOut, Shield,
  Hammer, Rocket, Gift, Sparkles, Bot, Flame, MoreHorizontal, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePro } from '../../hooks/usePro';
import { getBuilder2Agents, getBuilderPagePath } from '../../data/agents';

// Builder 2 has no dedicated guide page (unlike Builder 1's
// /builder-1-guide), so its dashboard entry point goes straight to the
// first session in the tier.
const builder2FirstAgent = getBuilder2Agents()[0];

const NAV_ITEMS = [
  { to: '/dashboard', end: true, icon: Home, label: 'Home' },
  { to: '/dashboard/live-sessions', end: false, icon: Video, label: 'Live Sessions' },
  { to: '/dashboard/replays', end: false, icon: PlayCircle, label: 'Replays' },
  { to: '/dashboard/community', end: false, icon: MessagesSquare, label: 'Community' },
  { to: '/dashboard/account', end: false, icon: UserCircle2, label: 'Account' },
  { to: '/dashboard/refer', end: false, icon: Gift, label: 'Refer & Earn' },
  { to: '/dashboard/help', end: false, icon: HelpCircle, label: 'Help' },
];

// Only the mobile bottom nav needs a short primary row — the desktop
// sidebar has the vertical room to just list everything. The rest live
// behind "More" on mobile (see MoreSheet below).
// Stable id for the dashboard tour (DashboardTour.jsx) to find each nav item:
// '/dashboard' -> 'home', '/dashboard/community' -> 'community', etc.
const tourId = (to) => to.replace('/dashboard', '').replace(/^\//, '') || 'home';

const MOBILE_PRIMARY_PATHS = new Set(['/dashboard', '/dashboard/live-sessions', '/dashboard/community']);

function NavItems({ onNavigate, hasUnreadCommunity }) {
  return (
    <ul className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ to, end, icon: Icon, label }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            data-tour={tourId(to)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-[#F3EBFF] dark:bg-brand/15 text-brand'
                  : 'text-[#4A4463] dark:text-[#B7AFC9] hover:bg-[#FAF8FF] dark:hover:bg-white/5 hover:text-ink'
              }`
            }
          >
            <span className="relative flex-shrink-0">
              <Icon className="w-[18px] h-[18px]" />
              {label === 'Community' && hasUnreadCommunity && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </span>
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

// Shared between the desktop sidebar and the mobile "More" sheet so every
// entitled product gets one entry here — AI Agent Mastery and AI Agents
// Live have real destinations already (a dedicated course page for the
// former, the tier-scoped /dashboard/live-sessions for the latter, same
// place their own pricing-card "you're enrolled" links already send
// people) but were never wired into this list. `rowClass` lets each
// caller keep its own exact NavLink styling (desktop vs. the sheet's
// slightly taller rows) without duplicating this whole block.
function MyCoursesSection({ rowClass, onNavigate }) {
  const { isAdmin, hasBuilder1, hasBuilder2, hasVibeCoding, hasAiMastery, hasAgentsLive } = usePro();
  if (!(hasBuilder1 || hasBuilder2 || hasVibeCoding || hasAiMastery || hasAgentsLive || isAdmin)) return null;

  return (
    <>
      <div className="border-t border-[#EFE9FB] dark:border-[#232228] my-3" />
      <p data-tour="my-courses" className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 px-3.5 mb-1.5">My Courses</p>
      {(hasVibeCoding || isAdmin) && (
        <NavLink to="/vibe-coding/course" onClick={onNavigate} className={rowClass}>
          <Sparkles className="w-[18px] h-[18px] flex-shrink-0" /> Vibe Coding
        </NavLink>
      )}
      {(hasBuilder1 || isAdmin) && (
        <NavLink to="/builder-1-guide" onClick={onNavigate} className={rowClass}>
          <Hammer className="w-[18px] h-[18px] flex-shrink-0" /> Builder 1
        </NavLink>
      )}
      {(hasBuilder2 || isAdmin) && builder2FirstAgent && (
        <NavLink to={getBuilderPagePath(builder2FirstAgent)} onClick={onNavigate} className={rowClass}>
          <Rocket className="w-[18px] h-[18px] flex-shrink-0" /> Builder 2
        </NavLink>
      )}
      {(hasAiMastery || isAdmin) && (
        <NavLink to="/ai-agent-mastery/course" onClick={onNavigate} className={rowClass}>
          <Bot className="w-[18px] h-[18px] flex-shrink-0" /> AI Agent Mastery
        </NavLink>
      )}
      {(hasAgentsLive || isAdmin) && (
        <NavLink to="/dashboard/live-sessions" onClick={onNavigate} className={rowClass}>
          <Flame className="w-[18px] h-[18px] flex-shrink-0" /> AI Agents Live
        </NavLink>
      )}
    </>
  );
}

const desktopRowClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
    isActive
      ? 'bg-[#F3EBFF] dark:bg-brand/15 text-brand'
      : 'text-[#4A4463] dark:text-[#B7AFC9] hover:bg-[#FAF8FF] dark:hover:bg-white/5 hover:text-ink'
  }`;

// Desktop-only persistent left sidebar — mobile nav is the separate
// DashboardMobileNav bottom bar (see StudentDashboard.jsx), matching the
// "collapses to a bottom nav on mobile" requirement rather than squeezing
// this same component into a hamburger drawer.
export default function DashboardSidebar({ hasUnreadCommunity }) {
  const { user, signOut } = useAuth();
  const { isAdmin } = usePro();
  const navigate = useNavigate();

  const displayName = user?.user_metadata?.display_name || user?.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 bg-white dark:bg-[#0A090F] border-r border-[#EFE9FB] dark:border-[#232228] px-4 py-5">
      <NavLink to="/" className="flex items-center gap-2.5 px-1.5 mb-8">
        <img src="/logo-icon.webp" alt="" className="w-9 h-9 object-contain rounded-lg" />
        <span className="font-display font-extrabold text-[14px] text-ink tracking-tight leading-tight">
          Social Dev<br />Technologies
        </span>
      </NavLink>

      <nav className="flex-1 overflow-y-auto">
        <NavItems hasUnreadCommunity={hasUnreadCommunity} />
        <MyCoursesSection rowClass={desktopRowClass} />
        {isAdmin && (
          <>
            <div className="border-t border-[#EFE9FB] dark:border-[#232228] my-3" />
            <NavLink
              to="/admin"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-amber-700 dark:text-amber-400 hover:bg-[#FEF9E7] dark:hover:bg-amber-500/10 transition-colors"
            >
              <Shield className="w-[18px] h-[18px] flex-shrink-0" /> Admin
            </NavLink>
          </>
        )}
      </nav>

      <div className="border-t border-[#EFE9FB] dark:border-[#232228] pt-3 mt-3">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-extrabold text-[13px] flex-shrink-0">
            {initial}
          </div>
          <span className="font-bold text-ink text-sm truncate">{displayName}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-500 hover:bg-[#FAF8FF] dark:hover:bg-white/5 transition-colors"
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" /> Log out
        </button>
      </div>
    </aside>
  );
}

function MoreSheet({ onClose }) {
  const { isAdmin } = usePro();
  const secondaryItems = NAV_ITEMS.filter(({ to }) => !MOBILE_PRIMARY_PATHS.has(to));

  const rowClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-[#F3EBFF] dark:bg-brand/15 text-brand'
        : 'text-[#4A4463] dark:text-[#B7AFC9] hover:bg-[#FAF8FF] dark:hover:bg-white/5'
    }`;

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white dark:bg-[#0A090F] rounded-t-2xl border-t border-[#EFE9FB] dark:border-[#232228] max-h-[75vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#EFE9FB] dark:border-[#232228]">
          <span className="font-display font-bold text-ink text-[15px]">More</span>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-[#FAF8FF] dark:hover:bg-white/5">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
        <div className="flex flex-col gap-1 p-3">
          {secondaryItems.map(({ to, end, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={end} onClick={onClose} className={rowClass}>
              <Icon className="w-[18px] h-[18px] flex-shrink-0" /> {label}
            </NavLink>
          ))}
          <MyCoursesSection rowClass={rowClass} onNavigate={onClose} />
          {isAdmin && (
            <>
              <div className="border-t border-[#EFE9FB] dark:border-[#232228] my-2" />
              <NavLink to="/admin" onClick={onClose} className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-amber-700 dark:text-amber-400 hover:bg-[#FEF9E7] dark:hover:bg-amber-500/10 transition-colors">
                <Shield className="w-[18px] h-[18px] flex-shrink-0" /> Admin
              </NavLink>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Kept to a short primary row (Home, Live Sessions, Community, More) so it
// never turns back into the wall-to-wall icon strip this replaced — every
// course link, Account, Refer & Earn and Help moved into the "More" sheet
// instead of fighting for space in a `flex-1` row that used to hold up to
// 10 items on a phone-width screen.
export function DashboardMobileNav({ hasUnreadCommunity }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryItems = NAV_ITEMS.filter(({ to }) => MOBILE_PRIMARY_PATHS.has(to));

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#0A090F] border-t border-[#EFE9FB] dark:border-[#232228] flex items-stretch">
        {primaryItems.map(({ to, end, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            data-tour={tourId(to)}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10.5px] font-semibold transition-colors ${
                isActive ? 'text-brand' : 'text-gray-400'
              }`
            }
          >
            <span className="relative">
              <Icon className="w-5 h-5" />
              {label === 'Community' && hasUnreadCommunity && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </span>
            {label}
          </NavLink>
        ))}
        <button
          type="button"
          data-tour="more"
          onClick={() => setMoreOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10.5px] font-semibold text-gray-400"
        >
          <MoreHorizontal className="w-5 h-5" />
          More
        </button>
      </nav>
      {moreOpen && <MoreSheet onClose={() => setMoreOpen(false)} />}
    </>
  );
}
