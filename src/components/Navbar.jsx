import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import { Menu, X, Shield, Zap, Award, Sun, Moon, ChevronDown, LayoutDashboard, LogOut } from 'lucide-react';
import SearchBar from './SearchBar';
import { useAuth } from '../context/AuthContext';
import { usePro } from '../hooks/usePro';
import { useTheme } from '../context/ThemeContext';

const links = [
  { to: '/', label: 'Home' },
  { to: '/catalog', label: 'Catalog' },
  // The three sellable programs — this dropdown replaces the old standalone
  // "Programs" nav item entirely (founder-confirmed 2026-09-22); "Learning
  // Paths" no longer links directly to /paths (the difficulty/department
  // catalog browser), which still exists but is reached from elsewhere
  // (Home.jsx, Catalog) rather than the top-level nav.
  { label: 'Learning Paths', children: [
      // AI Agent Mastery listed first — it's the priority/flagship program
      // (founder-confirmed 2026-09-23).
      { to: '/ai-agent-mastery', label: 'AI Agent Mastery' },
      { to: '/ai-builder', label: 'AI Agent Guides' },
      { to: '/vibe-coding', label: 'Vibe Coding Bootcamp' },
    ] },
  // Grouped under one "Learn" dropdown rather than separate top-level links.
  // Both stay real, separately-crawlable routes — the dropdown is only a
  // navigation affordance, not a tab switcher that would hide one of them
  // from crawlers.
  { label: 'Learn', children: [{ to: '/guides', label: 'Guides' }, { to: '/news', label: 'AI News' }] },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const { isPro, isAdmin } = usePro();
  const { theme, toggleTheme } = useTheme();

  // Keep the search box in sync with ?q= while on /catalog: seeded from the
  // URL on mount, then re-synced during render whenever the query changes.
  // Doing it during render rather than in an effect avoids a second render
  // pass per change — see react.dev "You Might Not Need an Effect".
  const catalogQuery = location.pathname === '/catalog' ? searchParams.get('q') || '' : null;
  const [value, setValue] = useState(catalogQuery || '');
  const [syncedQuery, setSyncedQuery] = useState(catalogQuery);
  if (catalogQuery !== null && catalogQuery !== syncedQuery) {
    setSyncedQuery(catalogQuery);
    setValue(catalogQuery);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleChange = (v) => {
    setValue(v);
    navigate(`/catalog${v ? `?q=${encodeURIComponent(v)}` : ''}`);
  };

  const displayName = user?.user_metadata?.display_name || user?.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-[#FFFDFF] dark:bg-[#0A090F] border-b border-[#EFE9FB] dark:border-[#232228]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[70px] flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <img src="/logo-icon.webp" alt="" className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-lg" />
          <span className="font-display font-extrabold text-[15px] sm:text-base text-ink tracking-tight whitespace-nowrap">
            Social Dev<span className="text-brand"> Technologies</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 ml-6 font-semibold text-[14.5px] text-[#4A4463] dark:text-[#B7AFC9] flex-shrink-0">
          {links.map((link) =>
            link.children ? (
              <div key={link.label} className="relative group flex-shrink-0">
                <button
                  className={`flex items-center gap-1 whitespace-nowrap transition-colors ${
                    link.children.some((c) => location.pathname.startsWith(c.to)) ? 'text-brand' : 'hover:text-ink'
                  }`}
                >
                  {link.label}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {/* Hover-opened, but rendered in the DOM at all times so the
                    links inside are always crawlable. */}
                <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity">
                  <div className="w-44 bg-white dark:bg-[#141319] border border-[#EFE9FB] dark:border-[#232228] rounded-xl shadow-[0_16px_40px_-12px_rgba(30,20,60,.3)] py-1.5 overflow-hidden">
                    {link.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        className={({ isActive }) =>
                          `block px-4 py-2.5 text-sm font-semibold transition-colors ${
                            isActive
                              ? 'text-brand bg-[#F7F4FF] dark:bg-white/5'
                              : 'text-[#4A4463] dark:text-[#B7AFC9] hover:bg-[#FAF8FF] dark:hover:bg-white/5'
                          }`
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) => `flex-shrink-0 whitespace-nowrap transition-colors ${isActive ? 'text-brand' : 'hover:text-ink'}`}
              >
                {link.label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="flex-1 hidden md:block max-w-xs ml-4">
          <SearchBar value={value} onChange={handleChange} />
        </div>

        <div className="hidden lg:flex items-center gap-4 ml-auto flex-shrink-0">
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#F3EBFF] dark:bg-white/10 text-brand flex-shrink-0 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {user ? (
            <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-full hover:bg-[#F7F4FF] dark:hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-extrabold text-[13px] flex-shrink-0">
                  {initial}
                </div>
                <span className="font-bold text-ink text-sm whitespace-nowrap max-w-[120px] truncate">{displayName}</span>
                {isAdmin ? (
                  <span className="flex items-center gap-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    <Shield className="w-2.5 h-2.5" /> ADMIN
                  </span>
                ) : isPro ? (
                  <span className="flex items-center gap-0.5 text-[10px] font-bold bg-brand text-white px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    <Zap className="w-2.5 h-2.5" /> PRO
                  </span>
                ) : null}
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <m.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#141319] border border-[#EFE9FB] dark:border-[#232228] rounded-xl shadow-[0_16px_40px_-12px_rgba(30,20,60,.3)] py-1.5 overflow-hidden"
                  >
                    <NavLink
                      to="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors ${isActive ? 'text-brand bg-[#F7F4FF] dark:bg-white/5' : 'text-[#4A4463] dark:text-[#B7AFC9] hover:bg-[#FAF8FF] dark:hover:bg-white/5'}`
                      }
                    >
                      <LayoutDashboard className="w-4 h-4" /> My Dashboard
                    </NavLink>
                    <NavLink
                      to="/certificates"
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors ${isActive ? 'text-brand bg-[#F7F4FF] dark:bg-white/5' : 'text-[#4A4463] dark:text-[#B7AFC9] hover:bg-[#FAF8FF] dark:hover:bg-white/5'}`
                      }
                    >
                      <Award className="w-4 h-4" /> Certificates
                    </NavLink>
                    {isAdmin && (
                      <NavLink
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors ${isActive ? 'text-brand bg-[#F7F4FF] dark:bg-white/5' : 'text-amber-600 hover:bg-[#FAF8FF] dark:hover:bg-white/5'}`
                        }
                      >
                        <Shield className="w-4 h-4" /> Admin
                      </NavLink>
                    )}
                    <div className="border-t border-[#EFE9FB] dark:border-[#232228] my-1" />
                    <button
                      onClick={() => { setMenuOpen(false); handleSignOut(); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-gray-500 hover:bg-[#FAF8FF] dark:hover:bg-white/5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Log out
                    </button>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link to="/welcome" className="font-bold text-brand text-[14.5px] whitespace-nowrap flex-shrink-0">
                Log in
              </Link>
              <Link
                to="/welcome"
                className="bg-brand text-white font-bold px-5 py-2.5 rounded-full text-[14.5px] whitespace-nowrap flex-shrink-0 shadow-[0_6px_16px_rgba(124,58,237,.35)] hover:bg-brand-deep transition-colors"
              >
                Start building
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="lg:hidden ml-auto w-9 h-9 flex items-center justify-center rounded-lg bg-[#F3EBFF] dark:bg-white/10 text-brand flex-shrink-0"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-[#EFE9FB] dark:border-[#232228] overflow-hidden bg-white dark:bg-[#0A090F]"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-[#4A4463] dark:text-[#B7AFC9] hover:bg-[#FAF8FF] dark:hover:bg-white/5 mb-1"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              </button>
              <SearchBar value={value} onChange={handleChange} className="mb-2" />
              {/* Flattened on mobile — a nested dropdown inside an already
                  collapsible menu is worse than just listing the children. */}
              {links.flatMap((link) =>
                link.children
                  ? link.children.map((child) => ({ ...child, indented: true }))
                  : [link],
              ).map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      isActive ? 'text-brand bg-[#F3EBFF] dark:bg-white/10' : 'text-[#4A4463] dark:text-[#B7AFC9] hover:bg-[#FAF8FF] dark:hover:bg-white/5'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              <div className="border-t border-[#EFE9FB] dark:border-[#232228] mt-2 pt-3">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 px-3.5 py-2 mb-1">
                      <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center font-extrabold text-xs flex-shrink-0">
                        {initial}
                      </div>
                      <span className="font-bold text-ink text-sm truncate">{displayName}</span>
                      {isAdmin ? (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          <Shield className="w-2.5 h-2.5" /> ADMIN
                        </span>
                      ) : isPro ? (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold bg-brand text-white px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          <Zap className="w-2.5 h-2.5" /> PRO
                        </span>
                      ) : null}
                    </div>
                    <NavLink
                      to="/dashboard"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-[#4A4463] dark:text-[#B7AFC9] hover:bg-[#FAF8FF] dark:hover:bg-white/5"
                    >
                      <LayoutDashboard className="w-4 h-4" /> My Dashboard
                    </NavLink>
                    <NavLink
                      to="/certificates"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-[#4A4463] dark:text-[#B7AFC9] hover:bg-[#FAF8FF] dark:hover:bg-white/5"
                    >
                      <Award className="w-4 h-4" /> Certificates
                    </NavLink>
                    {isAdmin && (
                      <NavLink
                        to="/admin"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-amber-700"
                      >
                        <Shield className="w-4 h-4" /> Admin
                      </NavLink>
                    )}
                    <button
                      onClick={() => { setOpen(false); handleSignOut(); }}
                      className="w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-semibold text-gray-500 hover:bg-[#FAF8FF] dark:hover:bg-white/5"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/welcome"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-full text-sm font-bold bg-brand text-white"
                  >
                    Start building
                  </Link>
                )}
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}
