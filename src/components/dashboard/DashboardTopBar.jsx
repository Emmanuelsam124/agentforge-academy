import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Bell } from 'lucide-react';
import SearchBar from '../SearchBar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// The bell was deliberately left out until there was a real notifications
// backend to drive it (a bell that never does anything is exactly the kind
// of "looks real, isn't" UI this dashboard avoids). Community's unread
// state (see useCommunityUnread) is real now, so this bell reflects that —
// it's not yet a general notification feed, just the one real signal that
// exists, and it takes you straight to it.
export default function DashboardTopBar({ hasUnreadCommunity }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const displayName = user?.user_metadata?.display_name || user?.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF]/95 dark:bg-[#0C1420]/95 backdrop-blur border-b border-[#E7ECF2] dark:border-[#26364B] px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3 sm:gap-4">
      {/* The sidebar (and its logo) is desktop-only, so phones get the mark here. */}
      <Link to="/" aria-label="Social Dev Technologies home" className="lg:hidden flex-shrink-0">
        <img src="/logo-icon.webp" alt="" className="w-9 h-9 object-contain rounded-lg" />
      </Link>
      <div className="flex-1 min-w-0 max-w-xs">
        <SearchBar value="" onChange={(v) => navigate(`/catalog${v ? `?q=${encodeURIComponent(v)}` : ''}`)} />
      </div>
      <div className="flex items-center gap-2 sm:gap-3 ml-auto flex-shrink-0">
        <button
          onClick={() => navigate('/dashboard/community')}
          aria-label={hasUnreadCommunity ? 'New community messages' : 'Community'}
          className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-[#E8EDF3] dark:bg-white/10 text-link transition-colors"
        >
          <Bell className="w-4 h-4" />
          {hasUnreadCommunity && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#E8EDF3] dark:bg-white/10 text-link transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-extrabold text-[13px] flex-shrink-0 lg:hidden">
          {initial}
        </div>
      </div>
    </header>
  );
}
