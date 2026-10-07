import { AnimatePresence, m } from 'framer-motion';
import { X, Target, MessageCircle, Sparkles, Users, ArrowRightCircle } from 'lucide-react';

export default function PresenterNotes({ open, onClose, notes, slideLabel, index, total }) {
  if (!notes) return null;

  return (
    <AnimatePresence>
      {open && (
        <m.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden border-t border-border-soft bg-[#F6F8FB] dark:bg-[#131E2F] flex-shrink-0"
        >
          <div className="max-w-3xl mx-auto px-5 py-4 max-h-[42vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wide text-link">
                Presenter notes · Slide {index + 1}/{total} · {slideLabel}
              </span>
              <button onClick={onClose} aria-label="Close presenter notes" className="text-gray-400 hover:text-ink transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3.5 text-[13px]">
              <NoteBlock icon={Target} title="Objective" text={notes.objective} />
              <NoteBlock icon={ArrowRightCircle} title="Transition" text={notes.transition} />
              <div className="sm:col-span-2">
                <NoteBlock icon={Sparkles} title="Talking points" list={notes.talkingPoints} />
              </div>
              <NoteBlock icon={Users} title="Story suggestion" text={notes.story} />
              <NoteBlock icon={MessageCircle} title="Audience interaction" text={notes.interactionPrompt} />
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

function NoteBlock({ icon: Icon, title, text, list }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-body mb-1">
        <Icon className="w-3.5 h-3.5 text-link" /> {title}
      </div>
      {list ? (
        <ul className="space-y-1 text-body-strong">
          {list.map((item) => (
            <li key={item} className="flex gap-1.5">
              <span className="text-link flex-shrink-0">·</span>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-strong leading-relaxed m-0">{text}</p>
      )}
    </div>
  );
}
