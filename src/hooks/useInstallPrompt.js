import { useCallback, useEffect, useState } from 'react';

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari's own (non-standard) flag for an already-installed PWA —
    // it never fires beforeinstallprompt or matches display-mode.
    window.navigator.standalone === true
  );
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

// Chrome/Edge/Android fire `beforeinstallprompt` when the page meets
// installability criteria (manifest + service worker) and let a page defer
// and later trigger the native install dialog itself — that's what this
// hook captures. iOS Safari never fires it (no native install API at all);
// there, "installing" means Share → Add to Home Screen, so the caller
// should show that instruction instead of a button when `isIOS` is true.
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(() => isStandalone());

  useEffect(() => {
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setInstalled(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return null;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    // The prompt is single-use regardless of the user's choice — Chrome
    // won't fire beforeinstallprompt again for the same deferred event.
    setDeferredPrompt(null);
    return choice;
  }, [deferredPrompt]);

  return {
    installed,
    canPrompt: Boolean(deferredPrompt),
    isIOS: isIOS(),
    promptInstall,
  };
}
