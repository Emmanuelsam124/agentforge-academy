import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import QRCode from 'qrcode';
import { useTheme } from '../../../context/ThemeContext';
import SlideShell from '../SlideShell';
import SignatureLine from '../SignatureLine';

import { EmojiText } from '../../EmojiIcon';
// Deliberately quiet — the pitch is already made by this point, so this is
// just a calm, low-distraction backdrop for live discussion, not another
// selling moment. Still carries a real QR/button (not just a URL to
// remember) so anyone who decides mid-Q&A can act immediately.
export default function QASlide() {
  const { theme } = useTheme();
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const bg = theme === 'dark'
    ? '#0C1420'
    : '#F6F8FB';

  useEffect(() => {
    const url = `${window.location.origin}/pricing`;
    QRCode.toDataURL(url, { width: 140, margin: 1, color: { dark: '#0F1A2A', light: '#FFFFFFFF' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, []);

  return (
    <SlideShell background={bg} decorations contentClassName="text-center flex flex-col items-center">
      <m.span
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 bg-white dark:bg-[#131E2F] border-[1.5px] border-border text-link font-bold text-[12.5px] px-4 py-2 rounded-full shadow-[0_3px_10px_rgba(15,26,42,.1)] mb-7"
      >
        <EmojiText>🙋 Open floor</EmojiText>
      </m.span>

      <m.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="font-display font-extrabold text-[42px] sm:text-[60px] leading-[1.05] text-ink tracking-[-1px] sm:tracking-[-1.5px]"
      >
        Questions?
      </m.h1>

      <m.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="text-body text-base mt-6"
      >
        The enrollment link is still live.
      </m.p>

      <m.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
        className="flex flex-col sm:flex-row items-center gap-4 mt-6"
      >
        <Link
          to="/pricing"
          className="bg-brand hover:bg-brand-deep text-white font-bold text-[15px] px-6 py-3 rounded-xl shadow-[0_8px_20px_rgba(15,26,42,.3)] transition-colors"
        >
          Get Builder 1 →
        </Link>

        {qrDataUrl && (
          <div className="bg-white dark:bg-[#131E2F] border border-border-soft rounded-xl p-2.5 shadow-sm">
            <img src={qrDataUrl} alt="QR code to Builder 1 pricing" width={80} height={80} />
          </div>
        )}
      </m.div>

      <div className="border-t border-border-soft pt-6 mt-8 max-w-md">
        <SignatureLine variant="light" delay={0.75} />
      </div>
    </SlideShell>
  );
}
