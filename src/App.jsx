import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { LazyMotion, domAnimation } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProfileInfoModal from './components/ProfileInfoModal';
import WhatsAppFloatButton from './components/WhatsAppFloatButton';
import { captureReferralFromLocation } from './lib/referral';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import PathDetail from './pages/PathDetail';
import BuilderSession from './pages/BuilderSession';
import Welcome from './pages/Welcome';
import Pricing from './pages/Pricing';
import Legal from './pages/Legal';
import About from './pages/About';
import FAQ from './pages/FAQ';
import WhatsAppBotGuide from './pages/WhatsAppBotGuide';
import AIBuilder from './pages/AIBuilder';
import VibeCoding from './pages/VibeCoding';
import AIAgentMastery from './pages/AIAgentMastery';
import Builder1Guide from './pages/Builder1Guide';
import PortfolioSessionGuide from './pages/PortfolioSessionGuide';
import DailyNewsSessionGuide from './pages/DailyNewsSessionGuide';
import WebinarSurvey from './pages/WebinarSurvey';
// /news and /guides are the one group of PUBLIC routes safe to lazy-load.
// The eager-import rule above exists because a lazy component introduces a
// Suspense boundary, and Suspense can't hydrate against a plain Puppeteer
// snapshot (React #418) — moot now that main.jsx always uses createRoot
// (never hydrateRoot, see that file), but these four still have their own
// reason to skip Suspense-vs-snapshot risk: their SSR functions emit
// data-ssr-stub="1" hand-written HTML, not real React output, so there was
// never a snapshot to reconcile against in the first place. Splitting them
// out keeps four page components (plus the guide renderer and the prompt
// generator) out of the entry bundle for the ~everyone who lands elsewhere.
const News = lazy(() => import('./pages/News'));
const NewsArticle = lazy(() => import('./pages/NewsArticle'));
const GuidesIndex = lazy(() => import('./pages/guides/GuidesIndex'));
const GuidePage = lazy(() => import('./pages/guides/GuidePage'));
import NotFound from './pages/NotFound';
import { useProgress } from './hooks/useProgress';
import { useCertificateClaims } from './hooks/useCertificateClaims';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProfileInfoProvider } from './context/ProfileInfoContext';

// scripts/prerender.mjs snapshots every route in scripts/prerender-routes.mjs
// (Home, Catalog, PathDetail, BuilderSession, Welcome, Pricing, Legal, About,
// FAQ) as static HTML that main.jsx hydrates on top of. React's Suspense
// hydration relies on special dehydrated-boundary markers that only a real
// Suspense-aware SSR pass emits — a plain Puppeteer DOM snapshot doesn't have
// them, so wrapping ANY of those routes' elements in <Suspense> (even ones
// that don't actually suspend) throws a React #418 hydration error on every
// visit. Those routes above are therefore kept as ordinary eager imports.
// Only the auth-gated pages below are safe to lazy-load — they're excluded
// from prerendering (nothing to index client-side) and always start from an
// empty #root via createRoot, so there's no static markup to reconcile
// against and no hydration boundary problem. (NotFound stays a normal eager
// import — it's already statically pulled in by BuilderSession.jsx and
// CertificateView.jsx as an inline fallback UI, so lazy-loading it here
// wouldn't shrink the bundle, just add a pointless Suspense boundary.)
const AgentModal = lazy(() => import('./components/AgentModal'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const Admin = lazy(() => import('./pages/Admin'));
const Certificates = lazy(() => import('./pages/Certificates'));
const CertificateView = lazy(() => import('./pages/CertificateView'));
const VerifyCertificate = lazy(() => import('./pages/VerifyCertificate'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ConfirmEmail = lazy(() => import('./pages/ConfirmEmail'));
const VibeCodingPrompts = lazy(() => import('./pages/VibeCodingPrompts'));
// Private, auth-gated course content (recording links, passcodes) — must
// never be prerendered/eager-imported, same reasoning as StudentDashboard.
const VibeCodingCourse = lazy(() => import('./pages/VibeCodingCourse'));
const AIAgentMasteryCourse = lazy(() => import('./pages/AIAgentMasteryCourse'));
// Full-screen keynote — deliberately excluded from prerendering (keyboard
// nav + fullscreen state have no business being static-snapshotted) and
// renders its own chrome, so AppShell below skips Navbar/Footer for it.
const Webinar = lazy(() => import('./pages/Webinar'));

function AppShell() {
  const { user } = useAuth();
  const progress = useProgress(user);
  useCertificateClaims(user?.id, progress.completed);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const location = useLocation();
  const isWebinar = location.pathname === '/webinar';

  // A referral link can land on any page, not just /welcome — capture it
  // here so browsing around before signing up doesn't lose attribution.
  // No-ops silently if there's no ?ref= param.
  useEffect(() => {
    captureReferralFromLocation();
  }, []);
  // The student dashboard renders its own sidebar/top-bar chrome (see
  // StudentDashboard.jsx) instead of the site Navbar/Footer — same
  // suppression pattern as the webinar keynote.
  const isDashboard = location.pathname.startsWith('/dashboard');
  const hideChrome = isWebinar || isDashboard;
  // The AI Agent Mastery classroom keeps the site footer on desktop only —
  // on phones it's dropped, same as the dashboard.
  const footerDesktopOnly = location.pathname.replace(/\/+$/, '') === '/ai-agent-mastery/course';

  return (
    // LazyMotion + the `m` components (rather than `motion`) keep framer-
    // motion's DOM feature set out of the entry bundle's critical path.
    // Every animated component in the app renders under this provider, and
    // `m` only works inside one — a bare <m.div> outside renders unanimated.
    //
    // `domAnimation` is imported statically, NOT as `features={() => import(
    // ...)}`. The async form is smaller still, but it swaps the feature
    // bundle in a tick after mount, which means the prerendered routes would
    // hydrate against markup whose animated elements haven't initialised —
    // the same class of mismatch the eager-import rule above exists to
    // avoid. domAnimation covers everything used here: there is no `layout`,
    // `layoutId` or `drag` prop anywhere in src/, which is all `domMax`
    // would add.
    <LazyMotion features={domAnimation}>
    <ProfileInfoProvider>
      <div className="min-h-screen flex flex-col bg-bg">
        {!hideChrome && <Navbar />}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home progress={progress} onSelectAgent={setSelectedAgent} />} />
            <Route path="/catalog" element={<Catalog progress={progress} onSelectAgent={setSelectedAgent} />} />
            <Route path="/paths" element={<PathDetail progress={progress} />} />
            <Route path="/builder-1/:slug" element={<BuilderSession progress={progress} tier="Builder 1" />} />
            <Route path="/builder-2/:slug" element={<BuilderSession progress={progress} tier="Builder 2" />} />
            <Route
              path="/dashboard/*"
              element={
                <Suspense fallback={null}>
                  <StudentDashboard progress={progress} onSelectAgent={setSelectedAgent} />
                </Suspense>
              }
            />
            <Route path="/welcome" element={<Welcome />} />
            <Route
              path="/reset-password"
              element={
                <Suspense fallback={null}>
                  <ResetPassword />
                </Suspense>
              }
            />
            <Route
              path="/auth/confirm"
              element={
                <Suspense fallback={null}>
                  <ConfirmEmail />
                </Suspense>
              }
            />
            <Route path="/pricing" element={<Pricing />} />
            <Route
              path="/webinar"
              element={
                <Suspense fallback={null}>
                  <Webinar />
                </Suspense>
              }
            />
            <Route
              path="/admin/*"
              element={
                <Suspense fallback={null}>
                  <Admin />
                </Suspense>
              }
            />
            <Route
              path="/certificates"
              element={
                <Suspense fallback={null}>
                  <Certificates progress={progress} />
                </Suspense>
              }
            />
            <Route
              path="/certificate/:id"
              element={
                <Suspense fallback={null}>
                  <CertificateView />
                </Suspense>
              }
            />
            <Route
              path="/verify/:id"
              element={
                <Suspense fallback={null}>
                  <VerifyCertificate />
                </Suspense>
              }
            />
            <Route path="/legal/:page" element={<Legal />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/whatsapp-bot-guide" element={<WhatsAppBotGuide />} />
            <Route path="/ai-builder" element={<AIBuilder />} />
            <Route path="/vibe-coding" element={<VibeCoding />} />
            <Route path="/vibe-coding/prompts" element={<Suspense fallback={null}><VibeCodingPrompts /></Suspense>} />
            <Route path="/vibe-coding/course" element={<Suspense fallback={null}><VibeCodingCourse /></Suspense>} />
            <Route path="/ai-agent-mastery" element={<AIAgentMastery />} />
            <Route path="/ai-agent-mastery/course" element={<Suspense fallback={null}><AIAgentMasteryCourse /></Suspense>} />
            <Route path="/builder-1-guide" element={<Builder1Guide />} />
            <Route path="/session/build-real-product" element={<PortfolioSessionGuide />} />
            <Route path="/session/daily-news-agent" element={<DailyNewsSessionGuide />} />
            <Route path="/webinar-survey" element={<WebinarSurvey />} />
            <Route path="/news" element={<Suspense fallback={null}><News /></Suspense>} />
            <Route path="/news/:slug" element={<Suspense fallback={null}><NewsArticle /></Suspense>} />
            {/* Evergreen explainer section — DB-backed, so one route handles
                every guide. Served by api/guide-article.js for crawlers (same
                SSR pattern as /news/:slug), not prerendered. */}
            <Route path="/guides" element={<Suspense fallback={null}><GuidesIndex /></Suspense>} />
            <Route path="/guides/:slug" element={<Suspense fallback={null}><GuidePage /></Suspense>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        {!hideChrome && (footerDesktopOnly ? <div className="hidden lg:block"><Footer /></div> : <Footer />)}
        {!hideChrome && <WhatsAppFloatButton />}

        {selectedAgent && (
          <Suspense fallback={null}>
            <AgentModal
              agent={selectedAgent}
              completed={progress.isCompleted(selectedAgent.id)}
              onToggleComplete={progress.toggleComplete}
              onClose={() => setSelectedAgent(null)}
              onSelectAgent={setSelectedAgent}
            />
          </Suspense>
        )}
        <ProfileInfoModal />
      </div>
    </ProfileInfoProvider>
    </LazyMotion>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
