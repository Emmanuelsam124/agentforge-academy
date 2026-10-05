import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, m } from 'framer-motion';
import { Users, CalendarDays, Video, MessageSquareText, Mail, Newspaper, BookOpen, LifeBuoy, Gift, ClipboardList, GraduationCap, ChevronDown } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/admin', end: true, icon: Users, label: 'Users' },
  { to: '/admin/cohorts', end: false, icon: CalendarDays, label: 'Cohort Schedule' },
  { to: '/admin/live-sessions', end: false, icon: Video, label: 'Live Sessions' },
  { to: '/admin/testimonials', end: false, icon: MessageSquareText, label: 'Testimonials' },
  { to: '/admin/emails', end: false, icon: Mail, label: 'Email Communications' },
  { to: '/admin/news', end: false, icon: Newspaper, label: 'News Review' },
  { to: '/admin/guides', end: false, icon: BookOpen, label: 'Guides' },
  { to: '/admin/support', end: false, icon: LifeBuoy, label: 'WhatsApp Support' },
  { to: '/admin/referrals', end: false, icon: Gift, label: 'Referral Payouts' },
  { to: '/admin/webinar-survey', end: false, icon: ClipboardList, label: 'Webinar Survey' },
  { to: '/admin/scholarships', end: false, icon: GraduationCap, label: 'Scholarships' },
];

function NavItems({ onNavigate }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {NAV_ITEMS.map(({ to, end, icon: Icon, label }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-[#F3EBFF] dark:bg-brand/15 text-brand font-bold'
                  : 'text-body hover:bg-[#FAF8FF] dark:hover:bg-white/5 hover:text-ink'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export default function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeLabel = NAV_ITEMS.find((item) =>
    item.end ? window.location.pathname === item.to : window.location.pathname.startsWith(item.to)
  )?.label;

  return (
    <>
      {/* Desktop — persistent sticky sidebar */}
      <aside className="hidden lg:block sticky top-24 self-start w-full rounded-xl border border-border-soft bg-[#FAF8FF] dark:bg-white/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-body mb-2 px-1">Admin Dashboard</p>
        <NavItems />
      </aside>

      {/* Mobile — collapsible toggle above the content */}
      <div className="lg:hidden rounded-xl border border-border-soft bg-[#FAF8FF] dark:bg-white/5 overflow-hidden">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-ink">
            {activeLabel || 'Admin Dashboard'}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${mobileOpen ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {mobileOpen && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3">
                <NavItems onNavigate={() => setMobileOpen(false)} />
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
