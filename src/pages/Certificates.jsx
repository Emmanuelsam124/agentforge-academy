import { Link, Navigate } from 'react-router-dom';
import { Award, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCertificates } from '../hooks/useCertificates';
import { getAgentsByDifficulty } from '../data/agents';
import { getDifficulty } from '../data/departments';
import { CERTIFICATE_TIERS } from '../data/certificateTiers';
import ProgressBar from '../components/ProgressBar';

import EmojiIcon from '../components/EmojiIcon';
export default function Certificates({ progress }) {
  const { user, loading: authLoading } = useAuth();
  const { certificates, loading } = useCertificates(user?.id);

  if (!authLoading && !user) return <Navigate to="/welcome" replace />;

  const singleTiers = CERTIFICATE_TIERS.filter((t) => t.difficulties.length === 1);
  const proficiencyTier = CERTIFICATE_TIERS.find((t) => t.key === 'proficiency');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink flex items-center gap-3">
          <Award className="w-7 h-7 text-link" />
          My Certificates
        </h1>
        <p className="text-body mt-2">Earned automatically the moment you complete every session in a tier.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-body gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading…
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-5">
            {singleTiers.map((tier) => (
              <CertificateCard
                key={tier.key}
                tier={tier}
                cert={certificates.find((c) => c.tier === tier.key)}
                progress={progress}
              />
            ))}
          </div>

          <div className="mt-5">
            <ProficiencyCard
              tier={proficiencyTier}
              cert={certificates.find((c) => c.tier === proficiencyTier.key)}
              progress={progress}
            />
          </div>
        </>
      )}
    </div>
  );
}

function CertificateCard({ tier, cert, progress }) {
  const difficulty = getDifficulty(tier.difficulties[0]);
  const tierAgents = getAgentsByDifficulty(tier.difficulties[0]);
  const completedCount = tierAgents.filter((a) => progress.isCompleted(a.id)).length;

  return (
    <div className="rounded-2xl border-[1.5px] border-border-soft bg-white dark:bg-[#131E2F] p-6 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <EmojiIcon emoji={tier.icon} className="w-6 h-6 text-link" />
        <h2 className="font-display font-bold text-lg text-ink">{tier.label}</h2>
      </div>

      {cert ? (
        <EarnedBlock cert={cert} />
      ) : (
        <div className="flex flex-col gap-4 flex-1">
          <ProgressBar value={completedCount} max={tierAgents.length} color={difficulty.color} label="Sessions completed" />
          <p className="text-xs text-body mt-auto">
            Complete all {tierAgents.length} {tier.label} sessions to earn this certificate automatically.
          </p>
          <Link
            to={`/catalog?difficulty=${encodeURIComponent(tier.label)}`}
            className="flex items-center justify-center gap-2 bg-[#F6F8FB] dark:bg-white/5 hover:bg-[#E8EDF3] dark:hover:bg-brand/10 border border-border-soft text-body-strong font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            Continue building
          </Link>
        </div>
      )}
    </div>
  );
}

function ProficiencyCard({ tier, cert, progress }) {
  const allAgents = tier.difficulties.flatMap((d) => getAgentsByDifficulty(d));
  const completedCount = allAgents.filter((a) => progress.isCompleted(a.id)).length;

  return (
    <div
      className="rounded-2xl border-[2px] border-amber-400 p-6 flex flex-col sm:flex-row sm:items-center gap-5"
      style={{ background: '#FEF9E7' }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <EmojiIcon emoji={tier.icon} className="w-8 h-8 text-link" />
        <div>
          <h2 className="font-display font-bold text-lg text-ink">{tier.label}</h2>
          <p className="text-xs text-body mt-0.5">Awarded once both Builder 1 and Builder 2 are fully complete.</p>
        </div>
      </div>

      {cert ? (
        <Link
          to={`/certificate/${cert.id}`}
          className="flex items-center justify-center gap-2 bg-amber-500 hover:brightness-95 text-white font-bold px-5 py-2.5 rounded-xl transition-colors flex-shrink-0"
        >
          View & Print <ExternalLink className="w-4 h-4" />
        </Link>
      ) : (
        <div className="w-full sm:w-56 flex-shrink-0">
          <ProgressBar value={completedCount} max={allAgents.length} color="#D9A406" label="Combined progress" />
        </div>
      )}
    </div>
  );
}

function EarnedBlock({ cert }) {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="rounded-xl bg-[#EAFAF1] dark:bg-green/10 border border-green/25 px-4 py-3">
        <p className="text-sm font-bold text-green">Certificate earned</p>
        <p className="text-xs text-body mt-0.5">
          Issued {new Date(cert.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
      <Link
        to={`/certificate/${cert.id}`}
        className="mt-auto flex items-center justify-center gap-2 bg-brand hover:bg-brand-deep text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
      >
        View & Print <ExternalLink className="w-4 h-4" />
      </Link>
    </div>
  );
}
