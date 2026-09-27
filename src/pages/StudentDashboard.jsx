import { Routes, Route, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLiveSessions } from '../hooks/useLiveSessions';
import DashboardSidebar, { DashboardMobileNav } from '../components/dashboard/DashboardSidebar';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import JumpBackInCard from '../components/dashboard/JumpBackInCard';
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
  const { user } = useAuth();
  const liveSessions = useLiveSessions(user);

  return (
    <div className="min-h-screen bg-bg">
      <DashboardSidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <DashboardTopBar />
        <div className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-20 lg:pb-6 grid lg:grid-cols-[1fr_300px] gap-8 items-start">
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
      <DashboardMobileNav />
    </div>
  );
}
