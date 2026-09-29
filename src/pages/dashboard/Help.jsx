import { Link } from 'react-router-dom';
import { HelpCircle, MessageCircle, Mail, ArrowRight, Compass } from 'lucide-react';
import { TOUR_START_EVENT } from '../../components/dashboard/DashboardTour';

export default function Help() {
  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink mb-6 flex items-center gap-3">
        <HelpCircle className="w-7 h-7 text-brand" /> Help
      </h1>

      <div className="flex flex-col gap-3 max-w-lg">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(TOUR_START_EVENT))}
          className="flex items-center gap-4 rounded-2xl border-[1.5px] border-border-soft bg-white dark:bg-[#181818] hover:bg-[#FAF8FF] dark:hover:bg-white/5 p-5 transition-colors text-left"
        >
          <div className="w-11 h-11 rounded-xl bg-[#F3EBFF] dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
            <Compass className="w-5 h-5 text-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-ink">Take the dashboard tour</p>
            <p className="text-sm text-body">A quick walk through where everything is.</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </button>

        <Link
          to="/faq"
          className="flex items-center gap-4 rounded-2xl border-[1.5px] border-border-soft bg-white dark:bg-[#181818] hover:bg-[#FAF8FF] dark:hover:bg-white/5 p-5 transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-[#F3EBFF] dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-5 h-5 text-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-ink">Frequently asked questions</p>
            <p className="text-sm text-body">Answers to common questions about the course and platform.</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </Link>

        <a
          href="https://wa.me/2349066006963"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-4 rounded-2xl border-[1.5px] border-border-soft bg-white dark:bg-[#181818] hover:bg-[#FAF8FF] dark:hover:bg-white/5 p-5 transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-[#EAFAF1] dark:bg-green/10 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-green" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-ink">Message us on WhatsApp</p>
            <p className="text-sm text-body">Stuck on something? Reach out directly.</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </a>

        <a
          href="mailto:support@socialdevtechnologies.com"
          className="flex items-center gap-4 rounded-2xl border-[1.5px] border-border-soft bg-white dark:bg-[#181818] hover:bg-[#FAF8FF] dark:hover:bg-white/5 p-5 transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-[#FEF9E7] dark:bg-amber-500/15 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-ink">Email support</p>
            <p className="text-sm text-body">support@socialdevtechnologies.com</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </a>
      </div>
    </div>
  );
}
