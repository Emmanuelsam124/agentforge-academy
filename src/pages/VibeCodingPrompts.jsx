import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Loader2, Copy, Check, ArrowLeft } from 'lucide-react';
import { usePro } from '../hooks/usePro';
import { useVibeCodingPrompts } from '../hooks/useVibeCodingContent';

function PromptCard({ prompt }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.prompt_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard access denied — nothing to do, the text is still selectable
    }
  };

  return (
    <div className="rounded-2xl border-[1.5px] border-border-soft bg-white dark:bg-[#131E2F] p-5 mb-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-display font-bold text-[15px] text-ink">{prompt.title}</h2>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#F6F8FB] dark:bg-white/5 text-body-strong hover:bg-[#E8EDF3] dark:hover:bg-brand/15 hover:text-link transition-colors flex-shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="whitespace-pre-wrap text-[12.5px] text-body-strong leading-relaxed bg-[#F6F8FB] dark:bg-white/5 rounded-xl p-4 font-sans">
        {prompt.prompt_text}
      </pre>
    </div>
  );
}

export default function VibeCodingPrompts() {
  const { hasVibeCoding, proLoading } = usePro();
  const { prompts, loading, locked } = useVibeCodingPrompts();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <Link to="/vibe-coding" className="inline-flex items-center gap-1.5 text-sm font-semibold text-body hover:text-link transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Vibe Coding Bootcamp
      </Link>

      <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink mb-2">Prompt library</h1>
      <p className="text-body text-[14.5px] mb-8">Copy-and-paste prompts you'll reuse throughout the bootcamp.</p>

      {(proLoading || loading) ? (
        <div className="flex items-center justify-center py-16 text-body gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading…
        </div>
      ) : !proLoading && (!hasVibeCoding || locked) ? (
        <div className="flex flex-col items-center text-center gap-3 py-16 border-2 border-dashed border-border rounded-2xl">
          <Lock className="w-8 h-8 text-link" />
          <p className="font-bold text-ink">Join the launch cohort to unlock the prompt library</p>
          <Link to="/vibe-coding#pricing" className="mt-2 inline-flex items-center gap-2 bg-brand hover:bg-brand-deep text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
            See the offer
          </Link>
        </div>
      ) : (
        <div>
          {prompts?.map((p) => <PromptCard key={p.id} prompt={p} />)}
        </div>
      )}
    </div>
  );
}
