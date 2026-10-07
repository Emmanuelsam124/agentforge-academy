import { Briefcase, Pencil } from 'lucide-react';
import { useProfileInfo } from '../context/ProfileInfoContext';

// The dashboard-only counterpart to the globally-mounted ProfileInfoModal —
// shows what's on file, or an easy way back into the modal if the user
// skipped it. Renders nothing while status is still loading/ineligible/
// eligible (the modal itself handles the "eligible" case by auto-opening).
export default function ProfileInfoSummary() {
  const { status, savedIndustry, setModalOpen } = useProfileInfo();

  if (status === 'set') {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border-soft bg-[#F6F8FB] dark:bg-white/5 px-5 py-3 mb-8">
        <p className="text-sm text-body">
          You're in <span className="font-semibold text-ink">{savedIndustry}</span>
        </p>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 text-sm font-semibold text-link hover:text-brand-deep"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
      </div>
    );
  }

  if (status === 'dismissed') {
    return (
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-2 text-sm text-body hover:text-link mb-8 -mt-2"
      >
        <Briefcase className="w-3.5 h-3.5" />
        Want tailored tips? Tell us your industry
      </button>
    );
  }

  return null;
}
