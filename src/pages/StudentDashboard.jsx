import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLiveSessions } from '../hooks/useLiveSessions';
import { useCommunityUnread } from '../hooks/useCommunity';
import DashboardSidebar, { DashboardMobileNav } from '../components/dashboard/DashboardSidebar';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import JumpBackInCard from '../components/dashboard/JumpBackInCard';
import InstallBanner from '../components/dashboard/InstallBanner';
import DashboardTour from '../components/dashboard/DashboardTour';
import Home from './dashboard/Home';
import LiveSessions from './dashboard/LiveSessions';
import Replays from './dashboard/Replays';
import Community from './dashboard/Community';
import Account from './dashboard/Account';
import Help from './dashboard/Help';
import Refer from './dashboard/Refer';

// Layout shell for every /dashboard/* page — sidebar + top bar + a
// persistent right-hand "Jump back in" card, mirroring Admin.jsx's
// nested-Routes-within-a-lazy-loaded-page pattern. liveSessions is fetched
// once here (not per sub-page) and threaded to children via Outlet context,
// same reasoning as Admin's shared showToast.
function DashboardOutlet({ context }) {
  return <Outlet context={context} />;
}

export default function StudentDashboard({ progress, onSelectAgent }) {
  const { user, loading } = useAuth();
  const liveSessions = useLiveSessions(user);
  const hasUnreadCommunity = useCommunityUnread();
  // Nothing here previously checked whether anyone was actually signed in —
  // /dashboard silently rendered this whole authenticated shell with blank/
  // empty data for a signed-out visitor, with no login form or link
  // anywhere in it. Harmless on the regular site (you only ever arrived
  // here already logged in), but the installed PWA's start_url opens
  // straight into /dashboard, and iOS's "Add to Home Screen" apps get a
  // storage container isolated from Safari itself — so a signed-out first
  // launch is now the common case, not an edge case, and needs a real way
  // out. `loading` (still resolving the stored session) must be checked
  // separately from `!user` (confirmed signed out), or a valid session
  // that just hasn't loaded yet gets bounced before it has a chance to.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <Loader2 className="w-6 h-6 animate-spin text-link" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/welcome?mode=login" replace />;
  }

  return (
    <div className="min-h-screen bg-bg overflow-x-clip">
      <DashboardSidebar hasUnreadCommunity={hasUnreadCommunity} />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <DashboardTopBar hasUnreadCommunity={hasUnreadCommunity} />
        <div className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-6">
          <InstallBanner />
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-8 items-start">
            <main className="min-w-0">
              <Routes>
                <Route element={<DashboardOutlet context={{ progress, onSelectAgent, liveSessions }} />}>
                  <Route index element={<Home />} />
                  <Route path="live-sessions" element={<LiveSessions />} />
                  <Route path="replays" element={<Replays />} />
                  <Route path="community" element={<Community />} />
                  <Route path="account" element={<Account />} />
                  <Route path="refer" element={<Refer />} />
                  <Route path="help" element={<Help />} />
                </Route>
              </Routes>
            </main>
            <aside className="hidden lg:block sticky top-24">
              <JumpBackInCard nextSession={liveSessions.nextSession} />
            </aside>
          </div>
        </div>
      </div>
      <DashboardMobileNav hasUnreadCommunity={hasUnreadCommunity} />
      <DashboardTour userId={user.id} />
    </div>
  );
}
