import { useEffect, useState } from 'react';
import { Star, X, Loader2, CheckCircle2, MessageSquareText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const MIN_COMPLETED_TO_PROMPT = 3;

export default function TestimonialPrompt({ completedCount }) {
  const { user } = useAuth();
  // Derived during render (not stored via setState-in-effect) so the
  // ineligible case doesn't need an extra render pass — see react.dev
  // "You Might Not Need an Effect".
  const eligible = Boolean(user) && isSupabaseConfigured && completedCount >= MIN_COMPLETED_TO_PROMPT;
  const dismissKey = user ? `sdt_testimonial_dismissed_${user.id}` : null;

  const [status, setStatus] = useState('loading'); // loading | eligible | already_submitted
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dismissedByUser, setDismissedByUser] = useState(false);
  // Read directly during render rather than mirroring into state via an
  // effect — it's a cheap synchronous lookup, not an async external event.
  const dismissed = dismissedByUser || (dismissKey ? localStorage.getItem(dismissKey) === 'true' : false);

  // Seed the editable display-name field from the user record during render
  // (adjusted whenever the signed-in user changes) instead of an effect.
  const [displayNameSyncedFor, setDisplayNameSyncedFor] = useState(null);
  if (user && displayNameSyncedFor !== user.id) {
    setDisplayNameSyncedFor(user.id);
    setDisplayName(user.user_metadata?.display_name || user.email?.split('@')[0] || '');
  }

  useEffect(() => {
    if (!eligible || dismissed) return;

    let cancelled = false;
    supabase
      .from('testimonials')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setStatus(data ? 'already_submitted' : 'eligible');
      });

    return () => {
      cancelled = true;
    };
  }, [eligible, dismissed, user, completedCount]);

  const dismiss = () => {
    if (dismissKey) localStorage.setItem(dismissKey, 'true');
    setDismissedByUser(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!body.trim()) {
      setError('Please write a few words first.');
      return;
    }
    setSubmitting(true);
    setError('');
    const { error: err } = await supabase.from('testimonials').insert({
      user_id: user.id,
      display_name: displayName.trim() || 'A Social Dev Technologies builder',
      body: body.trim(),
      rating,
      source: 'student',
      approved: false,
    });
    setSubmitting(false);
    if (err) {
      setError('Could not submit — please try again.');
      return;
    }
    setStatus('already_submitted');
  };

  if (!eligible || dismissed || status === 'loading') return null;

  if (status === 'already_submitted') {
    return (
      <div className="rounded-xl border border-green/25 bg-[#EAFAF1] dark:bg-green/10 px-5 py-4 flex items-center gap-3 mb-8">
        <CheckCircle2 className="w-5 h-5 text-green flex-shrink-0" />
        <p className="text-sm text-body-strong">
          Thanks for sharing your testimonial — it's pending a quick review before it goes live.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-[1.5px] border-brand/25 bg-[#E8EDF3] dark:bg-brand/10 p-5 mb-8">
      {!open ? (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <MessageSquareText className="w-5 h-5 text-link flex-shrink-0" />
            <p className="text-sm font-semibold text-ink">
              You've completed {completedCount} sessions — mind sharing a quick testimonial?
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setOpen(true)}
              className="bg-brand hover:bg-brand-deep text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
            >
              Write one
            </button>
            <button onClick={dismiss} className="text-sm font-semibold text-gray-400 hover:text-body px-2">
              Not now
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-ink">Share your experience</p>
            <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-body">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button type="button" key={i} onClick={() => setRating(i + 1)}>
                <Star className={`w-6 h-6 ${i < rating ? 'fill-yellow text-yellow' : 'fill-gray-200 text-gray-200'}`} />
              </button>
            ))}
          </div>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name (as you'd like it shown)"
            className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="What was your experience building with Social Dev Technologies?"
            className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
          />
          {error && <p className="text-xs text-rose">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-brand hover:bg-brand-deep disabled:opacity-60 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit testimonial
          </button>
        </form>
      )}
    </div>
  );
}
