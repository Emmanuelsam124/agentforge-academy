import { Link } from 'react-router-dom';
import {
  SCHOLARSHIP_CLOSES_AT,
  SCHOLARSHIP_PRICE_NAIRA,
  formatWatDateTime,
  isScholarshipOpen,
} from '../../data/scholarship';
import { AI_AGENT_MASTERY_PRICE } from '../../data/pricing';

// Shown only while scholarship applications are open (the same check the
// /scholarship page uses; the server enforces the real deadline). It is marked
// data-client-only so the prerender strips it: a snapshot taken before the
// deadline must not keep advertising it afterwards.
export default function ScholarshipBar() {
  if (!isScholarshipOpen()) return null;
  return (
    <div
      data-client-only
      className="on-dark bg-[#0F1A2A] dark:bg-surface dark:border-b dark:border-border px-4 sm:px-6 py-3 text-center text-[13px] sm:text-sm leading-relaxed text-[#F6F8FB]/90"
    >
      AI Agent Mastery scholarship: apply by {formatWatDateTime(SCHOLARSHIP_CLOSES_AT)}. Approved applicants pay
      ₦{SCHOLARSHIP_PRICE_NAIRA.toLocaleString()} instead of ₦{AI_AGENT_MASTERY_PRICE.toLocaleString()}.{' '}
      <Link to="/scholarship" className="font-bold text-yellow underline underline-offset-4 whitespace-nowrap ml-1">
        Apply
      </Link>
    </div>
  );
}
