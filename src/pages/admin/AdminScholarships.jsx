import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { GraduationCap, Loader2, AlertCircle, CheckCircle2, XCircle, MessageCircle, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { invokeWithRetry } from '../../lib/invokeFunction';
import { scholarshipWhatsappUrl, statusTypeLabel } from '../../data/scholarship';

const TABS = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
];

const fmtDate = (iso) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

function StatusBadge({ status, redeemed }) {
  if (redeemed) {
    return (
      <span className="flex items-center gap-1 text-[11px] font-bold text-brand bg-[#F3EBFF] dark:bg-brand/15 px-2.5 py-1 rounded-full">
        <CheckCircle2 className="w-3 h-3" /> Redeemed
      </span>
    );
  }
  if (status === 'approved') {
    return (
      <span className="flex items-center gap-1 text-[11px] font-bold text-green bg-[#EAFAF1] dark:bg-green/10 px-2.5 py-1 rounded-full">
        <CheckCircle2 className="w-3 h-3" /> Approved
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="flex items-center gap-1 text-[11px] font-bold text-rose bg-[#FDEEF4] dark:bg-rose/10 px-2.5 py-1 rounded-full">
        <XCircle className="w-3 h-3" /> Rejected
      </span>
    );
  }
  return (
    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-[#FEF9E7] dark:bg-amber-500/10 px-2.5 py-1 rounded-full">
      Pending
    </span>
  );
}

function Detail({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="text-[13.5px] text-body-strong break-words">{children}</dd>
    </div>
  );
}

// Scholarship applications. New ones wait here as Pending until you approve them
// (unless the SCHOLARSHIP_AUTO_APPROVE secret is "true"); approving here (or
// rejecting, to revoke before they pay) is what checkout looks at. Approving also
// emails the applicant (send-scholarship-approval-email). An application that has
// been redeemed — the person paid the scholarship price — is final.
export default function AdminScholarships() {
  const { showToast } = useOutletContext();
  const [status, setStatus] = useState('pending');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');

  // Loading/error are reset when a tab is picked (below), so the effect itself
  // only sets state after the request resolves.
  useEffect(() => {
    let cancelled = false;
    supabase.rpc('admin_list_scholarship_applications', { p_status: status }).then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) setError(err.message || 'Failed to load applications.');
      else setApplications(data || []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [status]);

  const pickTab = (id) => {
    if (id === status) return;
    setLoading(true);
    setError('');
    setStatus(id);
  };

  // Emails the applicant (admin-only function). Returns an error message, or ''.
  const sendApprovalEmail = async (application, resend = false) => {
    const { data, error: err } = await invokeWithRetry('send-scholarship-approval-email', {
      body: { id: application.id, resend },
    });
    if (!err && data?.ok) return { sentAt: data.sentAt ?? null, error: '' };
    let message = err?.message || 'Could not send the email.';
    try {
      const parsed = await err?.context?.clone().json();
      if (parsed?.error) message = parsed.error;
    } catch {
      // keep the generic message
    }
    return { sentAt: null, error: message };
  };

  const emailApplicant = async (application, resend) => {
    setActionLoading(application.id);
    setError('');
    const { sentAt, error: emailError } = await sendApprovalEmail(application, resend);
    if (emailError) setError(emailError);
    else {
      showToast('Approval email sent.');
      if (sentAt) {
        setApplications((prev) => prev.map((a) => (a.id === application.id ? { ...a, approval_email_sent_at: sentAt } : a)));
      }
    }
    setActionLoading(null);
  };

  const review = async (application, decision) => {
    setActionLoading(application.id);
    setError('');
    try {
      const { error: err } = await supabase.rpc('admin_review_scholarship', { p_id: application.id, p_decision: decision });
      if (err) throw err;
      const newStatus = { approve: 'approved', reject: 'rejected', pending: 'pending' }[decision];
      const reviewedAt = decision === 'pending' ? null : new Date().toISOString();
      // Keep the row on screen when it still belongs to this tab (or on "All");
      // otherwise it has moved to another tab, so drop it from this list.
      setApplications((prev) =>
        prev
          .map((a) => (a.id === application.id ? { ...a, status: newStatus, reviewed_at: reviewedAt } : a))
          .filter((a) => status === 'all' || a.status === status),
      );
      if (decision === 'approve') {
        // Approval stands even if the email fails; Resend email retries it.
        const { sentAt, error: emailError } = await sendApprovalEmail(application);
        if (emailError) {
          setError(`Approved, but the email wasn't sent: ${emailError}`);
        } else {
          if (sentAt) {
            setApplications((prev) => prev.map((a) => (a.id === application.id ? { ...a, approval_email_sent_at: sentAt } : a)));
          }
          showToast('Approved — email sent to the applicant.');
        }
      } else {
        showToast(`Marked ${newStatus}.`);
      }
    } catch (err) {
      setError(err.message || 'Could not update the application.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-3xl font-extrabold text-ink flex items-center gap-3">
          <GraduationCap className="w-7 h-7 text-brand" />
          Scholarships
        </h1>
        {applications.length > 0 && (
          <span className="text-xs font-bold text-body bg-[#F3EBFF] dark:bg-brand/15 px-2.5 py-1 rounded-full">
            {applications.length} shown
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => pickTab(t.id)}
            className={`text-[13px] font-semibold px-4 py-2 rounded-full border transition-colors ${
              status === t.id
                ? 'bg-brand text-white border-brand'
                : 'bg-white dark:bg-[#181818] text-body-strong border-border hover:border-brand/40'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] dark:bg-rose/10 border border-rose/20 rounded-lg px-4 py-3 mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-border-soft overflow-hidden bg-white dark:bg-[#181818]">
        {loading ? (
          <div className="px-5 py-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto" />
          </div>
        ) : applications.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400 text-sm">
            {status === 'pending' ? 'No applications waiting for review.' : 'No applications here.'}
          </div>
        ) : (
          applications.map((a) => (
            <div key={a.id} className="px-5 py-5 border-b border-border-soft last:border-b-0">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{a.full_name}</p>
                  <p className="text-[11.5px] text-gray-400">Applied {fmtDate(a.created_at)}</p>
                </div>
                <StatusBadge status={a.status} redeemed={!!a.redeemed_at} />
              </div>

              <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mb-3">
                <Detail label="Email (checkout)">{a.email}</Detail>
                <Detail label="WhatsApp">{a.whatsapp}</Detail>
                <Detail label="Current status">{statusTypeLabel(a.status_type)}</Detail>
                <Detail label="Heard about us">{a.how_heard}</Detail>
              </dl>
              <div className="mb-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Why they want it</p>
                <p className="text-[13.5px] text-body-strong whitespace-pre-wrap break-words">{a.reason}</p>
              </div>

              {a.redeemed_at && (
                <p className="text-[12.5px] text-body mb-3">
                  Redeemed {fmtDate(a.redeemed_at)}
                  {a.payment_reference ? <> · payment <span className="font-mono">{a.payment_reference}</span></> : null}
                </p>
              )}
              {a.status === 'approved' && !a.redeemed_at && (
                <p className="text-[12.5px] text-body mb-3 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  {a.approval_email_sent_at ? `Approval email sent ${fmtDate(a.approval_email_sent_at)}` : 'Approval email not sent yet'}
                </p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                {!a.redeemed_at && a.status !== 'approved' && (
                  <button
                    onClick={() => review(a, 'approve')}
                    disabled={actionLoading === a.id}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-deep disabled:opacity-40 text-white transition-colors"
                  >
                    {actionLoading === a.id && <Loader2 className="w-3 h-3 animate-spin" />}
                    Approve
                  </button>
                )}
                {!a.redeemed_at && a.status !== 'rejected' && (
                  <button
                    onClick={() => review(a, 'reject')}
                    disabled={actionLoading === a.id}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-body-strong hover:border-rose/50 hover:text-rose disabled:opacity-40 transition-colors"
                  >
                    Reject
                  </button>
                )}
                {!a.redeemed_at && a.status !== 'pending' && (
                  <button
                    onClick={() => review(a, 'pending')}
                    disabled={actionLoading === a.id}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-body hover:border-brand/40 disabled:opacity-40 transition-colors"
                  >
                    Back to pending
                  </button>
                )}
                {a.status === 'approved' && !a.redeemed_at && (
                  <button
                    onClick={() => emailApplicant(a, !!a.approval_email_sent_at)}
                    disabled={actionLoading === a.id}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-body-strong hover:border-brand/40 disabled:opacity-40 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" /> {a.approval_email_sent_at ? 'Resend email' : 'Send email'}
                  </button>
                )}
                <a
                  href={scholarshipWhatsappUrl(a)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#25D366] hover:brightness-95 text-white transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Message on WhatsApp
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
