import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function SlideNav({ index, total, slides, onNext, onPrev, onJump }) {
  return (
    <div className="flex items-center justify-center gap-4 px-4 py-3.5 flex-shrink-0 border-t border-border-soft">
      <button
        onClick={onPrev}
        disabled={index === 0}
        aria-label="Previous slide"
        className="w-9 h-9 flex items-center justify-center rounded-full bg-[#E8EDF3] dark:bg-white/10 text-link disabled:opacity-30 disabled:cursor-not-allowed transition-opacity flex-shrink-0"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1.5">
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => onJump(i)}
            aria-label={`Go to slide ${i + 1}: ${s.label}`}
            aria-current={i === index}
            className={`rounded-full transition-all ${i === index ? 'w-6 h-2 bg-brand' : 'w-2 h-2 bg-border hover:bg-brand/50'}`}
          />
        ))}
      </div>

      <span className="text-xs font-semibold text-body w-12 text-center flex-shrink-0 tabular-nums">
        {index + 1} / {total}
      </span>

      <button
        onClick={onNext}
        disabled={index === total - 1}
        aria-label="Next slide"
        className="w-9 h-9 flex items-center justify-center rounded-full bg-brand text-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity flex-shrink-0"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
