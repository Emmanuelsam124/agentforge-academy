import { Star, CheckCircle2 } from 'lucide-react';

export default function TestimonialCard({ testimonial }) {
  const { display_name, body, rating, source } = testimonial;

  return (
    <div className="flex flex-col gap-3 bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-2xl p-5 h-full">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? 'fill-yellow text-yellow' : 'fill-gray-200 text-gray-200'}`}
          />
        ))}
      </div>

      <p className="text-sm text-body-strong leading-relaxed flex-1">&ldquo;<span>{body}</span>&rdquo;</p>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border-soft">
        <span className="font-bold text-ink text-sm">{display_name}</span>
        {source === 'google_business' ? (
          <span className="text-[11px] font-semibold text-gray-500">Google review</span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-green">
            <CheckCircle2 className="w-3 h-3" /> Verified Builder
          </span>
        )}
      </div>
    </div>
  );
}
