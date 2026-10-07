import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { getCertificateTier } from '../data/certificateTiers';

export default function VerifyCertificate() {
  const { id } = useParams();
  const [status, setStatus] = useState('loading'); // loading | valid | revoked | not_found
  const [cert, setCert] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus('not_found');
      return;
    }
    let cancelled = false;
    supabase
      .rpc('get_certificate_by_id', { p_id: id })
      .then(({ data, error }) => {
        if (cancelled) return;
        const row = Array.isArray(data) ? data[0] : data;
        if (error || !row) {
          setStatus('not_found');
          return;
        }
        setCert(row);
        setStatus(row.revoked ? 'revoked' : 'valid');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <Link to="/" className="font-display font-extrabold text-lg text-ink">
        Social Dev <span className="text-link">Technologies</span>
      </Link>

      <div className="mt-8 rounded-2xl border-[1.5px] border-border-soft bg-white dark:bg-[#131E2F] p-8">
        {status === 'loading' && (
          <div className="flex items-center justify-center gap-2 text-body py-8">
            <Loader2 className="w-5 h-5 animate-spin" /> Checking certificate…
          </div>
        )}

        {status === 'valid' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green mx-auto mb-4" />
            <p className="font-display font-extrabold text-xl text-ink mb-1">Valid Certificate</p>
            <p className="text-sm text-body mb-6">This certificate was issued by Social Dev Technologies.</p>
            <div className="rounded-xl bg-[#F6F8FB] dark:bg-white/5 px-5 py-4 text-left space-y-2">
              <Row label="Issued to" value={cert.student_name} />
              <Row label="Track" value={getCertificateTier(cert.tier)?.label || cert.tier} />
              <Row
                label="Issued on"
                value={new Date(cert.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              />
            </div>
          </>
        )}

        {status === 'revoked' && (
          <>
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <p className="font-display font-extrabold text-xl text-ink mb-1">Certificate Revoked</p>
            <p className="text-sm text-body">
              This certificate was issued to <strong>{cert.student_name}</strong> but has since been revoked and is no
              longer valid.
            </p>
          </>
        )}

        {status === 'not_found' && (
          <>
            <XCircle className="w-12 h-12 text-rose mx-auto mb-4" />
            <p className="font-display font-extrabold text-xl text-ink mb-1">Certificate Not Found</p>
            <p className="text-sm text-body">
              We couldn't find a Social Dev Technologies certificate with this ID.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-body">{label}</span>
      <span className="font-bold text-ink">{value}</span>
    </div>
  );
}
