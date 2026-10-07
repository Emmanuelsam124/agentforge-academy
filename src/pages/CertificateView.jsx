import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { Printer, ArrowLeft, Loader2, Pencil, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { getCertificateTier } from '../data/certificateTiers';
import NotFound from './NotFound';

// Certificate names are a one-time snapshot taken when claim_certificate
// runs (see that RPC) — editing the Account page's display name afterward
// does not touch already-issued certificates, so a typo or a preferred
// full-legal-name change was previously unfixable. This lets the student
// correct it directly on the certificate that shows the problem.
function EditableName({ cert, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(cert.student_name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const startEdit = () => {
    setValue(cert.student_name);
    setError('');
    setEditing(true);
  };

  const save = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Name cannot be empty.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { data, error: err } = await supabase.rpc('update_certificate_name', { p_name: trimmed });
      if (err) throw err;
      // Applies to every certificate this student holds, not just this one
      // (see the RPC) — the caller only needs to update what's on screen.
      const updated = data?.find((c) => c.id === cert.id);
      onUpdated(updated?.student_name || trimmed);
      // Keeps the navbar/dashboard greeting in sync immediately, same
      // pattern Account.jsx uses after writing display_name.
      await supabase.auth.updateUser({ data: { display_name: trimmed } });
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Could not save your name.');
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <span className="inline-flex items-center gap-2 no-print">
        <span>{cert.student_name}</span>
        <button
          onClick={startEdit}
          aria-label="Edit the name on your certificates"
          title="Edit name"
          className="text-gray-400 hover:text-link transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-center gap-2 no-print">
      <span className="flex items-center gap-2">
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') setEditing(false);
          }}
          maxLength={100}
          className="text-center font-display font-extrabold text-2xl sm:text-3xl text-link bg-white dark:bg-[#0C1420] border-2 border-brand/40 rounded-lg px-3 py-1 focus:outline-none focus:border-brand"
        />
        <button
          onClick={save}
          disabled={saving}
          aria-label="Save name"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand hover:bg-brand-deep disabled:opacity-50 text-white flex-shrink-0"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </button>
        <button
          onClick={() => setEditing(false)}
          disabled={saving}
          aria-label="Cancel"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F6F8FB] dark:bg-white/5 hover:bg-[#E8EDF3] dark:hover:bg-white/10 text-body-strong flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </span>
      {error && <span className="text-xs font-semibold text-rose">{error}</span>}
      <span className="text-[11px] text-gray-400">Updates this name on all of your certificates.</span>
    </span>
  );
}

export default function CertificateView() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    if (authLoading || !user || !isSupabaseConfigured) return;
    let cancelled = false;
    supabase
      .from('certificates')
      .select('id, tier, student_name, issued_at, revoked')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setCert(data);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, user, authLoading]);

  useEffect(() => {
    if (!cert) return;
    const verifyUrl = `${window.location.origin}/verify/${cert.id}`;
    QRCode.toDataURL(verifyUrl, { width: 160, margin: 1, color: { dark: '#0F1A2A', light: '#00000000' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [cert]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24 text-body gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    );
  }

  if (!user || !cert) return <NotFound />;

  const tier = getCertificateTier(cert.tier);
  const isProficiency = cert.tier === 'proficiency';
  const verifyUrl = `${window.location.origin}/verify/${cert.id}`;

  return (
    <div id="certificate-page" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="no-print flex items-center justify-between mb-6">
        <Link to="/certificates" className="inline-flex items-center gap-1.5 text-sm font-semibold text-body hover:text-link transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to my certificates
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-brand hover:bg-brand-deep text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
        >
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      {/* Certificate */}
      <div
        id="certificate"
        className={`relative rounded-[24px] border-[6px] bg-white dark:bg-white px-10 sm:px-16 py-14 text-center overflow-hidden ${isProficiency ? 'border-amber-400' : 'border-brand'}`}
        style={{ background: isProficiency ? '#FFFCF3' : '#FFFFFF' }}
      >
        <div
          className="absolute top-6 right-8 w-24 h-24 opacity-[0.08] pointer-events-none"
          style={{ background: isProficiency ? '#D9A406' : '#264D73', borderRadius: '38% 62% 63% 37% / 41% 44% 56% 59%' }}
        />
        <p className={`text-xs font-bold uppercase tracking-[0.2em] ${isProficiency ? 'text-amber-600' : 'text-link'}`}>Social Dev Technologies</p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink dark:text-[#0F1A2A] mt-4">
          {isProficiency ? 'Certificate of Proficiency' : 'Certificate of Completion'}
        </h1>
        <p className="text-body dark:text-[#4A5B6C] mt-6 text-sm">This certifies that</p>
        <p className={`font-display font-extrabold text-2xl sm:text-3xl mt-2 ${isProficiency ? 'text-amber-600' : 'text-link'}`}>
          {/* print-only fallback: EditableName's own visible span is no-print,
              so this bare text is what actually appears on a printed/PDF
              certificate — the edit control never should. */}
          <span className="hidden print:inline">{cert.student_name}</span>
          <EditableName cert={cert} onUpdated={(name) => setCert((c) => ({ ...c, student_name: name }))} />
        </p>
        <p className="text-body dark:text-[#4A5B6C] mt-4 max-w-lg mx-auto leading-relaxed">
          {tier?.body || `has successfully completed the ${cert.tier} track.`}
        </p>
        <p className="text-sm text-body dark:text-[#4A5B6C] mt-8">
          Issued {new Date(cert.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        {cert.revoked && (
          <p className="mt-4 text-sm font-bold text-rose">This certificate has been revoked.</p>
        )}

        <div className="flex items-center justify-between mt-10 pt-6 border-t border-border-soft dark:border-[#E7ECF2]">
          <div className="text-left">
            <p className="text-[11px] text-gray-400">Verify this certificate at</p>
            <p className="text-xs font-semibold text-body-strong dark:text-[#1F2C3D] break-all">{verifyUrl}</p>
          </div>
          {qrDataUrl && <img src={qrDataUrl} alt="Verification QR code" className="w-20 h-20 flex-shrink-0" />}
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: landscape; margin: 0.4in; }
          html, body { height: 100%; background: white !important; }
          #certificate-page {
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
            height: 100vh;
            display: flex;
            flex-direction: column;
          }
          #certificate {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
