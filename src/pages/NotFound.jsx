import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { Home, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <p className="font-display text-8xl font-extrabold text-link mb-4">404</p>
        <h1 className="font-display text-2xl font-extrabold text-ink mb-3">Page not found</h1>
        <p className="text-body mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-deep text-white font-bold px-6 py-3 rounded-xl transition-colors">
            <Home className="w-4 h-4" /> Back to Home
          </Link>
          <Link to="/catalog" className="flex items-center justify-center gap-2 bg-white dark:bg-[#131E2F] hover:bg-[#F6F8FB] dark:hover:bg-white/5 border-[1.5px] border-border text-body-strong font-bold px-6 py-3 rounded-xl transition-colors">
            <Compass className="w-4 h-4" /> Browse Catalog
          </Link>
        </div>
      </m.div>
    </div>
  );
}
