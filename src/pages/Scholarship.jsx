import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle2, GraduationCap, Info, Lock } from 'lucide-react';
import { usePageSeo } from '../hooks/usePageSeo';
import { submitScholarshipApplication } from '../lib/scholarship';
import {
  SCHOLARSHIP_CLOSES_AT,
  SCHOLARSHIP_PRICE_NAIRA,
  STATUS_TYPE_OPTIONS,
  REASON_MAX,
  NAME_MAX,
  HOW_HEARD_MAX,
  formatWatDateTime,
  isScholarshipOpen,
  validateScholarshipForm,
} from '../data/scholarship';
import { AI_AGENT_MASTERY_PRICE, STUDENT_EMAIL_DOMAIN } from '../data/pricing';

const WHATSAPP_URL = 'https://wa.me/2349066006963';

const inputClass =
  'w-full rounded-xl border-[1.5px] border-border-soft bg-white dark:bg-[#181818] text-ink px-4 py-3 text-[15px] focus:outline-none focus:border-brand';

const cardClass =
  'rounded-[24px] border-[1.5px] border-border-soft bg-white dark:bg-[#181818] shadow-[0_20px_44px_-24px_rgba(124,58,237,.35)]';

const EMPTY = {
  full_name: '',
  whatsapp: '',
  email: '',
  status_type: '',
  reason: '',
  how_heard: '',
  consent: false,
};

function FieldError({ children }) {
  return (
    <p className="flex items-start gap-1.5 text-[12.5px] text-rose mt-1.5" role="alert">
      <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {children}
    </p>
  );
}

function Field({ id, label, hint, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[13.5px] font-bold text-ink mb-1.5">{label}</label>
      {children}
      {hint && !error && <p className="text-[12px] text-body mt-1.5">{hint}</p>}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

function Shell({ children }) {
  return (
    <div
      className="min-h-[70vh] px-4 sm:px-6 py-14"
      style={{ background: 'radial-gradient(120% 60% at 50% 0%, #F3EBFF 0%, #FBFAFF 60%)' }}
    >
      <div className="max-w-xl mx-auto">{children}</div>
    </div>
  );
}

export default function Scholarship() {
  usePageSeo({
    title: 'AI Agent Mastery Scholarship | Social Dev Technologies',
    description: 'Apply for a scholarship to join the AI Agent Mastery live cohort at a discounted price.',
    canonicalPath: '/scholarship',
  });

  const [form, setForm] = useState(EMPTY);
  // Honeypot: real visitors never see or fill this; bots that do are ignored
  // server-side.
  const [website, setWebsite] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [status, setStatus] = useState(() => (isScholarshipOpen() ? 'idle' : 'closed')); // idle | sending | done | closed
  const [submitError, setSubmitError] = useState('');

  const errors = validateScholarshipForm(form);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const err = (key) => (showErrors ? errors[key] : undefined);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setShowErrors(true);
    if (Object.keys(errors).length > 0) return;

    setStatus('sending');
    const result = await submitScholarshipApplication({ ...form, website });
    if (result.ok) {
      setStatus('done');
      return;
    }
    // The page can sit open past the deadline; the server is the one that knows.
    if (result.closed) {
      setStatus('closed');
      return;
    }
    setSubmitError(result.message);
    setStatus('idle');
  };

  if (status === 'closed') {
    return (
      <Shell>
        <div className={`${cardClass} p-7 sm:p-9 text-center`}>
          <GraduationCap className="w-10 h-10 text-brand mx-auto mb-3" />
          <h1 className="font-display font-extrabold text-2xl text-ink mb-2">Applications are closed</h1>
          <p className="text-[15px] text-body leading-relaxed mb-6">
            Scholarship applications for this AI Agent Mastery cohort closed on {formatWatDateTime(SCHOLARSHIP_CLOSES_AT)}.
            You're welcome to join a future cohort.
          </p>
          <Link
            to="/ai-agent-mastery"
            className="inline-block bg-brand hover:bg-brand-deep text-white font-extrabold px-7 py-3.5 rounded-xl transition-colors"
          >
            See AI Agent Mastery →
          </Link>
          <p className="text-[12.5px] text-body mt-5">
            Questions? Message us on{' '}
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="text-brand underline">WhatsApp</a>.
          </p>
        </div>
      </Shell>
    );
  }

  if (status === 'done') {
    return (
      <Shell>
        <div className={`${cardClass} p-7 sm:p-9 text-center`}>
          <CheckCircle2 className="w-10 h-10 text-green mx-auto mb-3" />
          <h1 className="font-display font-extrabold text-2xl text-ink mb-2">Thanks!</h1>
          <p className="text-[15px] text-body-strong leading-relaxed">
            We've received your application and may contact you on WhatsApp.
          </p>
          <p className="text-[13.5px] text-body leading-relaxed mt-3">
            To get the scholarship price, register on the AI Agent Mastery page with the same email you applied with
            — if your scholarship is approved, the discounted price applies automatically at checkout.
          </p>
          <Link
            to="/ai-agent-mastery"
            className="inline-block bg-brand hover:bg-brand-deep text-white font-extrabold px-7 py-3.5 rounded-xl transition-colors mt-6"
          >
            Go to AI Agent Mastery →
          </Link>
        </div>
      </Shell>
    );
  }

  const sending = status === 'sending';

  return (
    <Shell>
      <div className="text-center mb-7">
        <span className="inline-flex items-center gap-2 bg-white dark:bg-[#181818] border-[1.5px] border-border text-brand font-bold text-[12.5px] px-4 py-2 rounded-full shadow-[0_3px_10px_rgba(124,58,237,.1)]">
          <GraduationCap className="w-4 h-4" /> AI Agent Mastery scholarship
        </span>
        <h1 className="font-display font-extrabold text-[30px] sm:text-[38px] leading-[1.1] text-ink tracking-[-1px] mt-4">
          Apply for a scholarship
        </h1>
        <p className="text-[15.5px] text-body leading-relaxed mt-3">
          Approved applicants join the live cohort for ₦{SCHOLARSHIP_PRICE_NAIRA.toLocaleString()} instead of ₦
          {AI_AGENT_MASTERY_PRICE.toLocaleString()}. Applications close {formatWatDateTime(SCHOLARSHIP_CLOSES_AT)}.
        </p>
      </div>

      <div className="rounded-xl border border-brand/25 bg-white dark:bg-[#141319] px-4 py-3 text-[13.5px] text-body-strong mb-5 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
        <span>
          <strong className="text-ink">BYU-Pathway student?</strong> You don't need this form. Use your{' '}
          {STUDENT_EMAIL_DOMAIN} email at checkout.
        </span>
      </div>

      <form onSubmit={submit} noValidate className={`${cardClass} p-6 sm:p-8 space-y-5`}>
        <Field id="sch-name" label="Full name" error={err('full_name')}>
          <input
            id="sch-name"
            type="text"
            autoComplete="name"
            maxLength={NAME_MAX}
            value={form.full_name}
            onChange={set('full_name')}
            className={inputClass}
          />
        </Field>

        <Field
          id="sch-whatsapp"
          label="WhatsApp number"
          hint="With your country code — we'll contact you here."
          error={err('whatsapp')}
        >
          <input
            id="sch-whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+234 906 600 6963"
            value={form.whatsapp}
            onChange={set('whatsapp')}
            className={inputClass}
          />
        </Field>

        <Field
          id="sch-email"
          label="Email you'll use at checkout"
          hint="Use this same email when you register — that's how your scholarship price is applied."
          error={err('email')}
        >
          <input
            id="sch-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={form.email}
            onChange={set('email')}
            className={inputClass}
          />
        </Field>

        <Field id="sch-status" label="Current status" error={err('status_type')}>
          <select id="sch-status" value={form.status_type} onChange={set('status_type')} className={inputClass}>
            <option value="" disabled>Select one…</option>
            {STATUS_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>

        <Field id="sch-reason" label="Why do you want this scholarship?" error={err('reason')}>
          <textarea
            id="sch-reason"
            rows={5}
            value={form.reason}
            onChange={set('reason')}
            className={`${inputClass} resize-y`}
          />
          <p className={`text-[12px] mt-1.5 text-right ${form.reason.length > REASON_MAX ? 'text-rose font-bold' : 'text-body'}`}>
            {form.reason.length}/{REASON_MAX}
          </p>
        </Field>

        <Field id="sch-heard" label="How did you hear about us?" error={err('how_heard')}>
          <input
            id="sch-heard"
            type="text"
            maxLength={HOW_HEARD_MAX}
            placeholder="e.g. WhatsApp, a friend, Instagram"
            value={form.how_heard}
            onChange={set('how_heard')}
            className={inputClass}
          />
        </Field>

        {/* Honeypot — hidden from people and from assistive tech. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
        />

        <div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
              className="mt-1 w-4 h-4 accent-[#7C3AED] flex-shrink-0"
            />
            <span className="text-[13.5px] text-body-strong leading-relaxed">
              I agree that the information I've given is used only to review my application and to contact me about the cohort.
            </span>
          </label>
          {err('consent') && <FieldError>{err('consent')}</FieldError>}
        </div>

        {submitError && (
          <div className="flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] dark:bg-rose/10 border border-rose/20 rounded-lg px-3 py-2.5" role="alert">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={sending}
          className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-deep disabled:opacity-60 text-white font-extrabold px-5 py-3.5 rounded-xl shadow-[0_10px_22px_rgba(124,58,237,.35)] transition-colors"
        >
          {sending && <Loader2 className="w-4 h-4 animate-spin" />}
          {sending ? 'Submitting…' : 'Submit application'}
        </button>

        <p className="flex items-start gap-1.5 text-[12px] text-body">
          <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>
            Your details are only seen by our team. See our <Link to="/legal/privacy" className="underline hover:text-brand">privacy policy</Link>.
          </span>
        </p>
      </form>
    </Shell>
  );
}
