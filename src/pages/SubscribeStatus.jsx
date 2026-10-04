import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle, MailCheck, MailX } from 'lucide-react';
import { callEmailLeads } from '../lib/emailLeads';

// Landing pages for the links in the starter-series emails:
//   /subscribe/confirm?token=…  (mode "confirm")
//   /unsubscribe?token=…        (mode "unsubscribe")
//
// Both act only when a person presses the button, never on page load: mail
// scanners (Microsoft Safe Links etc.) pre-open every link in a message, and a
// scanner must not be able to confirm — or worse, unsubscribe — someone. Same
// reasoning as ConfirmEmail.jsx.
const COPY = {
  confirm: {
    icon: MailCheck,
    title: 'Confirm your email',
    intro: 'Press the button and we’ll send your free AI agent walkthrough straight away.',
    button: 'Yes, send me the series',
    busy: 'Confirming…',
    action: 'confirm',
    doneTitle: 'You’re in!',
    done: 'Your first email is on its way — check your inbox (and Spam or Promotions, just in case).',
  },
  unsubscribe: {
    icon: MailX,
    title: 'Unsubscribe',
    intro: 'Press the button to stop the starter-series emails. You can sign up again whenever you like.',
    button: 'Unsubscribe me',
    busy: 'Unsubscribing…',
    action: 'unsubscribe',
    doneTitle: 'You’re unsubscribed',
    done: 'We won’t send you any more of these emails.',
  },
};

export default function SubscribeStatus({ mode }) {
  const copy = COPY[mode];
  const Icon = copy.icon;
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState('idle'); // idle | working | done
  const [error, setError] = useState('');

  // A page reached from an email link has no business in search results.
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    const prevTitle = document.title;
    document.title = `${copy.title} — Social Dev Technologies`;
    return () => {
      document.head.removeChild(meta);
      document.title = prevTitle;
    };
  }, [copy.title]);

  const run = async () => {
    setError('');
    setStatus('working');
    const result = await callEmailLeads({ action: copy.action, token });
    if (!result.ok) {
      setError(result.message);
      setStatus('idle');
      return;
    }
    setStatus('done');
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm text-center bg-white dark:bg-[#181818] rounded-[22px] p-7 shadow-[0_30px_70px_-20px_rgba(20,10,50,.25)]">
        <Icon className="w-10 h-10 text-brand mx-auto mb-3" />
        {status === 'done' ? (
          <>
            <h1 className="font-display font-extrabold text-xl text-ink mb-1.5">{copy.doneTitle}</h1>
            <p className="text-[13.5px] text-body mb-5">{copy.done}</p>
            <Link to="/guides" className="inline-block bg-brand hover:bg-brand-deep text-white font-bold px-5 py-3 rounded-xl transition-colors">
              Browse the free guides →
            </Link>
          </>
        ) : token ? (
          <>
            <h1 className="font-display font-extrabold text-xl text-ink mb-1.5">{copy.title}</h1>
            <p className="text-[13.5px] text-body mb-5">{copy.intro}</p>
            {error && (
              <div className="flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] dark:bg-rose/10 border border-rose/20 rounded-lg px-3 py-2.5 mb-4 text-left">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
              </div>
            )}
            <button
              onClick={run}
              disabled={status === 'working'}
              className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-deep disabled:opacity-60 text-white font-extrabold px-5 py-3 rounded-xl transition-colors"
            >
              {status === 'working' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {status === 'working' ? copy.busy : copy.button}
            </button>
          </>
        ) : (
          <>
            <h1 className="font-display font-extrabold text-xl text-ink mb-1.5">{copy.title}</h1>
            <p className="text-[13.5px] text-body">This link is incomplete. Open it again from your email.</p>
          </>
        )}
      </div>
    </div>
  );
}
