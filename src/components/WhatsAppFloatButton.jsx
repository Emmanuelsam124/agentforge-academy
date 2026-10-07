const WHATSAPP_LINK = 'https://wa.me/2349066006963?text=' + encodeURIComponent(
  "Hi! I'd like to know more about Social Dev Technologies."
);

// Real WhatsApp glyph (not a lucide icon — lucide has no brand icons) so the
// button reads instantly as "chat on WhatsApp" rather than a generic
// message bubble.
function WhatsAppGlyph({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.47 14.38c-.29-.15-1.73-.85-2-.95-.27-.1-.46-.15-.66.15-.2.29-.76.95-.93 1.15-.17.2-.34.22-.63.07-.29-.15-1.22-.45-2.33-1.44-.86-.77-1.44-1.71-1.61-2-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.07-.15-.66-1.59-.91-2.18-.24-.57-.48-.5-.66-.51-.17-.01-.37-.01-.56-.01-.2 0-.51.07-.78.37-.27.29-1.02 1-1.02 2.44s1.05 2.83 1.19 3.03c.15.2 2.06 3.15 5 4.41.7.3 1.24.48 1.67.61.7.22 1.34.19 1.84.12.56-.08 1.73-.71 1.97-1.39.24-.68.24-1.27.17-1.39-.07-.12-.27-.2-.56-.34z" />
      <path d="M12.04 2.5c-5.26 0-9.54 4.28-9.54 9.54 0 1.68.44 3.32 1.28 4.76L2.5 21.5l4.85-1.27a9.5 9.5 0 0 0 4.69 1.24h.01c5.26 0 9.54-4.28 9.54-9.54 0-2.55-.99-4.94-2.79-6.74a9.47 9.47 0 0 0-6.76-2.69zm0 17.46h-.01a7.9 7.9 0 0 1-4.03-1.1l-.29-.17-3 .79.8-2.92-.19-.3a7.9 7.9 0 0 1-1.21-4.22c0-4.37 3.56-7.92 7.94-7.92a7.88 7.88 0 0 1 5.61 2.33 7.87 7.87 0 0 1 2.32 5.6c0 4.37-3.56 7.91-7.94 7.91z" />
    </svg>
  );
}

// Global floating "chat with an advisor" launcher, mounted once in App.jsx.
// Flat on purpose (no glow, pulse, entrance pop or hover scale), and in
// WhatsApp's darker teal green: white on the bright #25D366 is only ~2:1.
// A pre-sale contact channel — distinct from the (post-purchase) student
// WhatsApp community removed from the homepage's community section, which
// is only shared once someone actually signs up.
export default function WhatsAppFloatButton() {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with an advisor on WhatsApp"
      title="Chat with an advisor on WhatsApp"
      className="fixed bottom-5 right-5 z-30 w-14 h-14 rounded-full bg-[#128C7E] hover:bg-[#075E54] text-white flex items-center justify-center transition-colors"
    >
      <WhatsAppGlyph className="w-7 h-7" />
    </a>
  );
}
