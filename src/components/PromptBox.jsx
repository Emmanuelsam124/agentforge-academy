import { useState } from 'react';
import { Copy, Check, MessageSquareText } from 'lucide-react';

export default function PromptBox({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  return (
    <div className="rounded-lg border border-brand/25 bg-[#E8EDF3] dark:bg-brand/10 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-brand/15 bg-brand/[0.06] dark:bg-brand/[0.12]">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-link">
          <MessageSquareText className="w-3.5 h-3.5" />
          Prompt to use
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs font-semibold text-link hover:text-brand-deep transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="px-3.5 py-3 text-sm text-body-strong leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}
