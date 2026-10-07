import { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Briefcase, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { industries } from '../data/industries';
import { useProfileInfo } from '../context/ProfileInfoContext';

// Mounted once at the app-shell level (see App.jsx) so the "ask on login"
// popup can open on whichever page the user lands on first — not just the
// dashboard. The dashboard's slim summary/reminder row (ProfileInfoSummary)
// shares this same state via ProfileInfoContext and can reopen this modal.
export default function ProfileInfoModal() {
  const {
    user, modalOpen, closeModal, markSet,
    name, setName, selectedIndustry, setSelectedIndustry, customIndustry, setCustomIndustry,
  } = useProfileInfo();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!modalOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && closeModal({ skip: true });
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen]);

  useEffect(() => {
    if (modalOpen) setError('');
  }, [modalOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalIndustry = selectedIndustry === 'Other' ? customIndustry.trim() : selectedIndustry;
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!finalIndustry) {
      setError('Please choose or enter an industry.');
      return;
    }

    setSubmitting(true);
    setError('');

    const { error: err } = await supabase
      .from('profiles')
      .update({ display_name: name.trim(), industry: finalIndustry })
      .eq('id', user.id);

    if (err) {
      setSubmitting(false);
      setError('Could not save — please try again.');
      return;
    }

    // Keeps Navbar (which reads user.user_metadata.display_name) in sync
    // immediately, without waiting for the next login.
    await supabase.auth.updateUser({ data: { display_name: name.trim() } });

    setSubmitting(false);
    markSet(finalIndustry);
  };

  return (
    <AnimatePresence>
      {modalOpen && (
        <m.div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-[#0F1A2A]/55 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => closeModal({ skip: true })}
        >
          <m.div
            className="relative w-full sm:max-w-md rounded-2xl overflow-hidden bg-white dark:bg-[#131E2F] border border-border-soft mt-16 sm:mt-0"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => closeModal({ skip: true })}
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-lg bg-[#F6F8FB] dark:bg-[#0C1420] hover:bg-[#E8EDF3] dark:hover:bg-brand/15 text-link transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-5 h-5 text-link flex-shrink-0" />
                <p className="font-display text-lg font-extrabold text-ink">A little about you</p>
              </div>
              <p className="text-sm text-body -mt-2">
                Helps us tailor tips and emails to what's actually useful for you.
              </p>

              <div>
                <label className="block text-xs font-semibold text-body-strong mb-1.5">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0C1420] focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-body-strong mb-1.5">
                  Industry — current or one you'd like to move into
                </label>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0C1420] focus:outline-none focus:ring-2 focus:ring-brand/40"
                >
                  <option value="" disabled>Choose an industry…</option>
                  {industries.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>

              {selectedIndustry === 'Other' && (
                <input
                  value={customIndustry}
                  onChange={(e) => setCustomIndustry(e.target.value)}
                  placeholder="Your industry"
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0C1420] focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              )}

              {error && <p className="text-xs text-rose">{error}</p>}

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => closeModal({ skip: true })}
                  className="text-sm font-semibold text-gray-400 hover:text-body"
                >
                  Skip for now
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-brand hover:bg-brand-deep disabled:opacity-60 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
