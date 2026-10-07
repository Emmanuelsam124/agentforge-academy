import { useState } from 'react';
import { m } from 'framer-motion';
import { Star, Loader2, CheckCircle2, MessageSquareText } from 'lucide-react';
import { usePageSeo } from '../hooks/usePageSeo';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

// Public, anonymous, insert-only — for the ~200 webinar signups who either
// never joined or joined but didn't buy Builder 1. Reached only via a direct
// link sent to that list, so (like Builder1Guide/PortfolioSessionGuide) it's
// deliberately left out of scripts/prerender-routes.mjs and sitemap.xml.
const NO_JOIN_REASONS = [
  'Forgot about it',
  'Had a time conflict',
  'Lost interest',
  'Technical issues joining',
  "Wasn't sure it was for me",
  'Other',
];

const SIGNUP_REASONS = [
  'Price / cost',
  "Didn't have time right now",
  "Wasn't confident it was the right fit for me",
  'Wanted to see more proof/results first',
  "Still deciding — haven't gotten to it",
  'Found another course or resource',
  'Other',
];

const PRICE_BANDS = [
  'Under ₦10,000',
  '₦10,000 – ₦25,000',
  '₦25,000 – ₦50,000',
  '₦50,000 is fine',
  'More than ₦50,000',
];

function OptionRow({ label, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 rounded-xl border-[1.5px] text-sm font-semibold transition-colors ${
        selected
          ? 'border-brand bg-[#E8EDF3] dark:bg-brand/15 text-link'
          : 'border-border-soft text-ink hover:border-brand/40'
      }`}
    >
      {label}
    </button>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="font-bold text-sm text-ink mb-3">
        {label}
        {required && <span className="text-link ml-1">*</span>}
      </div>
      {children}
    </div>
  );
}

export default function WebinarSurvey() {
  usePageSeo({
    title: 'Webinar feedback survey — Social Dev Technologies',
    description: 'A quick survey for webinar signups — help us understand your experience and what would make Builder 1 the right fit for you.',
  });

  const [attended, setAttended] = useState(null); // 'yes' | 'no'
  const [noJoinReason, setNoJoinReason] = useState('');
  const [rating, setRating] = useState(0);
  const [webinarFeedback, setWebinarFeedback] = useState('');
  const [signupReason, setSignupReason] = useState('');
  const [signupReasonOther, setSignupReasonOther] = useState('');
  const [priceBand, setPriceBand] = useState('');
  const [priceExact, setPriceExact] = useState('');
  const [changeMind, setChangeMind] = useState('');
  const [email, setEmail] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const showsPriceQuestion = signupReason === 'Price / cost';

  const validate = () => {
    if (!attended) return 'Let us know whether you joined the webinar.';
    if (attended === 'no' && !noJoinReason) return 'Pick what kept you from joining.';
    if (attended === 'yes' && rating === 0) return 'Give the webinar a star rating.';
    if (!signupReason) return "Let us know why Builder 1 wasn't a fit yet.";
    if (signupReason === 'Other' && !signupReasonOther.trim()) return 'Tell us a bit more in the "Other" box.';
    if (showsPriceQuestion && !priceBand) return "Pick what you'd be comfortable paying.";
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!isSupabaseConfigured) {
      setError('Could not submit right now — please try again later.');
      return;
    }

    setSubmitting(true);
    setError('');
    const { error: err } = await supabase.from('webinar_survey_responses').insert({
      attended_webinar: attended === 'yes',
      webinar_rating: attended === 'yes' ? rating : null,
      webinar_feedback: webinarFeedback.trim() || null,
      no_join_reason: attended === 'no' ? noJoinReason : null,
      no_signup_reason: signupReason,
      no_signup_reason_other: signupReason === 'Other' ? signupReasonOther.trim() : null,
      willingness_to_pay: showsPriceQuestion
        ? [priceBand, priceExact.trim() && `exact: ${priceExact.trim()}`].filter(Boolean).join(' — ')
        : null,
      change_mind_feedback: changeMind.trim() || null,
      contact_email: email.trim() || null,
    });
    setSubmitting(false);
    if (err) {
      setError('Could not submit — please try again.');
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
        <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <CheckCircle2 className="w-12 h-12 text-green mx-auto mb-5" />
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink tracking-[-0.5px] mb-3">
            Thanks — that's genuinely useful
          </h1>
          <p className="text-body text-sm leading-relaxed">
            We read every response. If you left your email, we may reach out with something tailored to what you told us.
          </p>
        </m.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <span className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-1.5 rounded-full bg-[#E8EDF3] dark:bg-brand/15 text-link">
          2-minute survey
        </span>
        <h1 className="font-display font-extrabold text-[32px] sm:text-[42px] leading-[1.1] text-ink tracking-[-1px] mt-4 mb-3">
          Help us understand what happened
        </h1>
        <p className="text-body text-sm sm:text-base leading-relaxed mb-10 max-w-xl">
          You signed up for our webinar but haven't joined Builder 1 yet. No pressure — we just want your honest
          feedback so we can make this genuinely worth your time.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-2xl p-5 sm:p-7"
        >
          <Field label="Did you join the live webinar?" required>
            <div className="grid grid-cols-2 gap-3">
              <OptionRow label="Yes, I joined" selected={attended === 'yes'} onSelect={() => setAttended('yes')} />
              <OptionRow label="No, I didn't" selected={attended === 'no'} onSelect={() => setAttended('no')} />
            </div>
          </Field>

          {attended === 'no' && (
            <Field label="What kept you from joining?" required>
              <div className="flex flex-col gap-2">
                {NO_JOIN_REASONS.map((reason) => (
                  <OptionRow
                    key={reason}
                    label={reason}
                    selected={noJoinReason === reason}
                    onSelect={() => setNoJoinReason(reason)}
                  />
                ))}
              </div>
            </Field>
          )}

          {attended === 'yes' && (
            <>
              <Field label="How would you rate the webinar overall?" required>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button type="button" key={i} onClick={() => setRating(i + 1)}>
                      <Star className={`w-7 h-7 ${i < rating ? 'fill-yellow text-yellow' : 'fill-gray-200 text-gray-200'}`} />
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Anything you'd like to share about the webinar?">
                <textarea
                  value={webinarFeedback}
                  onChange={(e) => setWebinarFeedback(e.target.value)}
                  rows={3}
                  placeholder="What stood out, or what could've been better"
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
                />
              </Field>
            </>
          )}

          <Field label="Why didn't you sign up for the Builder 1 course?" required>
            <div className="flex flex-col gap-2">
              {SIGNUP_REASONS.map((reason) => (
                <OptionRow
                  key={reason}
                  label={reason}
                  selected={signupReason === reason}
                  onSelect={() => setSignupReason(reason)}
                />
              ))}
            </div>
            {signupReason === 'Other' && (
              <input
                value={signupReasonOther}
                onChange={(e) => setSignupReasonOther(e.target.value)}
                placeholder="Tell us more"
                className="mt-2 w-full px-3 py-2 rounded-lg border border-border text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            )}
          </Field>

          {showsPriceQuestion && (
            <Field label="What would you be comfortable paying for a course like this?" required>
              <div className="flex flex-col gap-2 mb-2">
                {PRICE_BANDS.map((band) => (
                  <OptionRow key={band} label={band} selected={priceBand === band} onSelect={() => setPriceBand(band)} />
                ))}
              </div>
              <input
                value={priceExact}
                onChange={(e) => setPriceExact(e.target.value)}
                placeholder="Or type an exact amount (optional)"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </Field>
          )}

          <Field label="Is there anything that would change your mind about joining?">
            <textarea
              value={changeMind}
              onChange={(e) => setChangeMind(e.target.value)}
              rows={3}
              placeholder="Optional"
              className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
            />
          </Field>

          <Field label="Want us to follow up with a personalized offer? Leave your email.">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com (optional)"
              className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </Field>

          {error && <p className="text-sm text-rose mt-6">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-6 flex items-center justify-center gap-2 bg-brand hover:bg-brand-deep disabled:opacity-60 text-white text-sm font-bold px-4 py-3 rounded-xl transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquareText className="w-4 h-4" />}
            Submit feedback
          </button>
        </form>
      </m.div>
    </div>
  );
}
