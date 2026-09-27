import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Video, PlayCircle, MessagesSquare, UserCircle2, HelpCircle, LogOut, Shield, Hammer, Rocket, Gift, Sparkles } from 'lucide-react';
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

function NavItems({ onNavigate }) {
  return (
    <ul className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ to, end, icon: Icon, label }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-[#F3EBFF] dark:bg-brand/15 text-brand'
                  : 'text-[#4A4463] dark:text-[#B7AFC9] hover:bg-[#FAF8FF] dark:hover:bg-white/5 hover:text-ink'
              }`
            }
          >
            <Icon className="w-[18px] h-[18px] flex-shrink-0" />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

// Desktop-only persistent left sidebar — mobile nav is the separate
// DashboardMobileNav bottom bar (see StudentDashboard.jsx), matching the
// "collapses to a bottom nav on mobile" requirement rather than squeezing
// this same component into a hamburger drawer.
export default function DashboardSidebar() {
  const { user, signOut } = useAuth();
  const { isAdmin, hasBuilder1, hasBuilder2, hasVibeCoding } = usePro();
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
        <NavItems />
        {(hasBuilder1 || hasBuilder2 || hasVibeCoding || isAdmin) && (
          <>
            <div className="border-t border-[#EFE9FB] dark:border-[#232228] my-3" />
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 px-3.5 mb-1.5">My Courses</p>
            {(hasVibeCoding || isAdmin) && (
              <NavLink
                to="/vibe-coding/course"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#F3EBFF] dark:bg-brand/15 text-brand'
                      : 'text-[#4A4463] dark:text-[#B7AFC9] hover:bg-[#FAF8FF] dark:hover:bg-white/5 hover:text-ink'
                  }`
                }
              >
                <Sparkles className="w-[18px] h-[18px] flex-shrink-0" /> Vibe Coding
              </NavLink>
            )}
            {(hasBuilder1 || isAdmin) && (
              <NavLink
                to="/builder-1-guide"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#F3EBFF] dark:bg-brand/15 text-brand'
                      : 'text-[#4A4463] dark:text-[#B7AFC9] hover:bg-[#FAF8FF] dark:hover:bg-white/5 hover:text-ink'
                  }`
                }
              >
                <Hammer className="w-[18px] h-[18px] flex-shrink-0" /> Builder 1
              </NavLink>
            )}
            {(hasBuilder2 || isAdmin) && builder2FirstAgent && (
              <NavLink
                to={getBuilderPagePath(builder2FirstAgent)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#F3EBFF] dark:bg-brand/15 text-brand'
                      : 'text-[#4A4463] dark:text-[#B7AFC9] hover:bg-[#FAF8FF] dark:hover:bg-white/5 hover:text-ink'
                  }`
                }
              >
                <Rocket className="w-[18px] h-[18px] flex-shrink-0" /> Builder 2
              </NavLink>
            )}
          </>
        )}
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

export function DashboardMobileNav() {
  const { isAdmin, hasBuilder1, hasBuilder2, hasVibeCoding } = usePro();
  const showVibeCoding = hasVibeCoding || isAdmin;
  const showBuilder1 = hasBuilder1 || isAdmin;
  const showBuilder2 = (hasBuilder2 || isAdmin) && builder2FirstAgent;
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#0A090F] border-t border-[#EFE9FB] dark:border-[#232228] flex items-stretch">
      {NAV_ITEMS.map(({ to, end, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10.5px] font-semibold transition-colors ${
              isActive ? 'text-brand' : 'text-gray-400'
            }`
          }
        >
          <Icon className="w-5 h-5" />
          {label}
        </NavLink>
      ))}
      {showVibeCoding && (
        <NavLink
          to="/vibe-coding/course"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10.5px] font-semibold transition-colors ${
              isActive ? 'text-brand' : 'text-gray-400'
            }`
          }
        >
          <Sparkles className="w-5 h-5" />
          Vibe Coding
        </NavLink>
      )}
      {showBuilder1 && (
        <NavLink
          to="/builder-1-guide"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10.5px] font-semibold transition-colors ${
              isActive ? 'text-brand' : 'text-gray-400'
            }`
          }
        >
          <Hammer className="w-5 h-5" />
          Builder 1
        </NavLink>
      )}
      {showBuilder2 && (
        <NavLink
          to={getBuilderPagePath(builder2FirstAgent)}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10.5px] font-semibold transition-colors ${
              isActive ? 'text-brand' : 'text-gray-400'
            }`
          }
        >
          <Rocket className="w-5 h-5" />
          Builder 2
        </NavLink>
      )}
    </nav>
  );
}
