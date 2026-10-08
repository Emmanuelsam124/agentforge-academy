import { useState } from 'react';
import { Copy, Check, MessageSquareText, Code } from 'lucide-react';

// variant "prompt" (default): wrapped prose the student pastes into an AI.
// variant "code": a long script the student pastes into an editor. Monospace,
// no wrapping, and a height cap so a 300-line file doesn't push the rest of
// the guide off the screen. Copy always copies the whole text either way.
export default function PromptBox({ text, variant = 'prompt' }) {
  const [copied, setCopied] = useState(false);
  const isCode = variant === 'code';
  const Icon = isCode ? Code : MessageSquareText;

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
          <Icon className="w-3.5 h-3.5" />
          {isCode ? 'Code to paste' : 'Prompt to use'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs font-semibold text-link hover:text-brand-deep transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {isCode ? (
        <pre
          tabIndex={0}
          aria-label="Code to paste"
          className="m-0 px-3.5 py-3 text-[13px] text-body-strong leading-relaxed font-mono whitespace-pre overflow-auto max-h-[28rem]"
        >
          <code>{text}</code>
        </pre>
      ) : (
        <p className="px-3.5 py-3 text-sm text-body-strong leading-relaxed whitespace-pre-wrap">{text}</p>
      )}
    </div>
  );
}
