import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import QRCode from 'qrcode';
import SlideShell from '../SlideShell';

export default function FinalCtaSlide() {
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    const url = `${window.location.origin}/pricing`;
    QRCode.toDataURL(url, { width: 180, margin: 1, color: { dark: '#0F1A2A', light: '#FFFFFFFF' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, []);

  return (
    <SlideShell background="#264D73" contentClassName="text-center flex flex-col items-center">
      <div className="max-w-xl">
        <m.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-[#D5DEE9] text-base sm:text-lg font-semibold"
        >
          Six months from now —
        </m.p>
        <m.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-white/70 text-base sm:text-lg mt-1.5"
        >
          someone asks, "Can anyone build something that solves this?"
        </m.p>

        <m.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          className="text-[#D5DEE9] text-base sm:text-lg font-semibold mt-6"
        >
          Instead of saying "I don't know..." —
        </m.p>
        <m.h2
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, delay: 1.7 }}
          className="font-display font-extrabold text-[28px] sm:text-[42px] text-yellow leading-tight mt-2"
        >
          you say "I can build that."
        </m.h2>

        <m.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.3 }}
          className="text-white text-lg sm:text-xl font-display font-bold mt-6"
        >
          That is what becoming an AI Builder looks like.
        </m.p>
      </div>

      <m.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.6 }}
        className="text-[#D5DEE9] text-[13px] mt-3"
      >
        Builder 1 is simply where that journey begins.
      </m.p>

      <m.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 3.15 }}
        className="flex flex-col sm:flex-row items-center gap-6 mt-7"
      >
        <Link
          to="/pricing"
          className="bg-yellow text-ink font-extrabold text-lg px-8 py-4 rounded-2xl shadow-[0_14px_30px_rgba(0,0,0,.25)] hover:brightness-95 transition-all"
        >
          Get Builder 1 now →
        </Link>

        {qrDataUrl && (
          <div className="bg-white rounded-2xl p-3 shadow-lg">
            <img src={qrDataUrl} alt="QR code to Builder 1 pricing" width={110} height={110} />
            <div className="text-[10px] font-bold text-ink text-center mt-1 uppercase tracking-wide">Scan to enroll</div>
          </div>
        )}
      </m.div>

      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.35 }}
        className="flex items-center gap-2.5 text-[#D5DEE9] text-[13px] font-semibold mt-8"
      >
        <span>1. Scan or click</span>
        <span className="opacity-50">→</span>
        <span>2. Sign up &amp; pay</span>
        <span className="opacity-50">→</span>
        <span>3. Start Session 1</span>
      </m.div>

      <m.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.5 }} className="text-[#D5DEE9] text-xs mt-3">
        One-time payment · 6 months of access · No subscription
      </m.p>
    </SlideShell>
  );
}
