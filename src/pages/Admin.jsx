import { useEffect, useState } from 'react';
import { useNavigate, Routes, Route, Outlet } from 'react-router-dom';
import { m } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePro } from '../hooks/usePro';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminUsers from './admin/AdminUsers';
import AdminCohorts from './admin/AdminCohorts';
import AdminLiveSessions from './admin/AdminLiveSessions';
import AdminTestimonials from './admin/AdminTestimonials';
import AdminEmails from './admin/AdminEmails';
import AdminNews from './admin/AdminNews';
import AdminGuides from './admin/AdminGuides';
import AdminSupport from './admin/AdminSupport';
import AdminReferrals from './admin/AdminReferrals';
import AdminSurvey from './admin/AdminSurvey';
import AdminScholarships from './admin/AdminScholarships';
import AdminCommunityBot from './admin/AdminCommunityBot';

// Passes showToast down to whichever section route is active via Outlet
// context, since a plain layout `element` can't take props from its parent
// any other way in React Router v6.
function ToastOutlet({ showToast }) {
  return <Outlet context={{ showToast }} />;
}

// Sidebar-navigated layout — each section below is its own route (matched
// relative to /admin/*, see App.jsx) and owns its own data fetching, so
// switching sections doesn't re-fetch or hold onto state for sections you've
// left. showToast is shared via Outlet context since every section triggers
// the same bottom-center toast on save/send/delete actions.
export default function Admin() {
  const { user } = useAuth();
  const { isAdmin, proLoading } = usePro();
  const navigate = useNavigate();
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    if (proLoading) return;
    if (!user || !isAdmin) {
      navigate('/', { replace: true });
    }
  }, [user, isAdmin, proLoading, navigate]);

  if (proLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-link" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-[240px_1fr] gap-8 items-start">
          <AdminSidebar />
          <div className="min-w-0">
            <Routes>
              <Route element={<ToastOutlet showToast={showToast} />}>
                <Route index element={<AdminUsers />} />
                <Route path="cohorts" element={<AdminCohorts />} />
                <Route path="live-sessions" element={<AdminLiveSessions />} />
                <Route path="testimonials" element={<AdminTestimonials />} />
                <Route path="emails" element={<AdminEmails />} />
                <Route path="news" element={<AdminNews />} />
                <Route path="guides" element={<AdminGuides />} />
                <Route path="support" element={<AdminSupport />} />
                <Route path="referrals" element={<AdminReferrals />} />
                <Route path="webinar-survey" element={<AdminSurvey />} />
                <Route path="scholarships" element={<AdminScholarships />} />
                <Route path="community-bot" element={<AdminCommunityBot />} />
              </Route>
            </Routes>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green text-white text-sm font-bold px-5 py-3 rounded-xl shadow-lg"
        >
          {toast}
        </m.div>
      )}
    </div>
  );
}
