import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

const DISMISS_KEY = 'sdt_install_banner_dismissed';

// Visible across every /dashboard/* page (mounted once in StudentDashboard's
// shell) rather than tucked away on the Account page alone — that card
// still exists for anyone who dismisses this and wants it back later.
// Only renders when there's an actual actionable step: a real native
// install button (Chrome/Edge/Android) or iOS's Add-to-Home-Screen
// instructions (Safari has no install API/beforeinstallprompt at all).
// Browsers that support neither just get the Account page's card.
export default function InstallBanner() {
  const { installed, canPrompt, isIOS, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === 'true';
    } catch {
      return false;
    }
  });

  if (installed || dismissed || !(canPrompt || isIOS)) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // Private browsing / storage blocked — the banner just reappears
      // next visit, not worth surfacing an error for.
    }
  };

  return (
    <div className="flex items-center gap-3 bg-[#F3EBFF] dark:bg-brand/10 border border-brand/20 rounded-xl px-4 py-3 mb-5">
      <Download className="w-4 h-4 text-brand flex-shrink-0" />
      <p className="flex-1 min-w-0 text-[13px] font-semibold text-body-strong">
        {canPrompt
          ? 'Install this dashboard as an app — one tap from your home screen, no browser tabs.'
          : 'Install this dashboard: tap Share, then "Add to Home Screen".'}
      </p>
      {canPrompt && (
        <button
          type="button"
          onClick={promptInstall}
          className="flex-shrink-0 bg-brand hover:bg-brand-deep text-white text-[12.5px] font-bold px-3.5 py-1.5 rounded-lg transition-colors"
        >
          Install
        </button>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-ink hover:bg-white/50 dark:hover:bg-white/10"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
