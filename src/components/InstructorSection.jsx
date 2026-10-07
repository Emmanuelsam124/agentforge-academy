import { INSTRUCTOR } from '../data/instructor';

// Shared "About the instructor" card — same photo, name, title, and bio on
// AIAgentMastery.jsx (it was shared with the AI Agents Live page, removed
// 2026-09-29; founder direction, 2026-09-27). `closingLine` is the one sentence that names the specific
// product/format being taught, since that can't be identical across pages.
export default function InstructorSection({ closingLine }) {
  return (
    <div className="px-4 sm:px-6 lg:px-[5vw] pb-16 max-w-4xl mx-auto">
      <div
        className="relative overflow-hidden rounded-[28px] border border-white/10 px-6 sm:px-12 py-10 sm:py-12"
        style={{ background: '#1B2A3E' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'transparent' }}
        />
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-7 sm:gap-9 text-center sm:text-left">
          <div className="relative flex-shrink-0">
            <img
              src={INSTRUCTOR.photo}
              alt={INSTRUCTOR.name}
              className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover border-[3px] border-[#131E2F] shadow-[0_10px_30px_rgba(0,0,0,.4)]"
            />
          </div>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-[#D5DEE9] bg-white/5 border border-white/10 px-3 py-1 rounded-full mb-3">
              Meet your instructor
            </span>
            <h2 className="font-display font-extrabold text-[22px] sm:text-[26px] text-white leading-tight">{INSTRUCTOR.name}</h2>
            <p className="text-[13.5px] font-semibold text-[#A2B1C3] mt-1 mb-4">{INSTRUCTOR.title}</p>
            <div className="flex flex-col gap-2.5">
              {INSTRUCTOR.bio.map((p) => (
                <p key={p} className="text-[14px] sm:text-[15px] text-[#D5DEE9] leading-relaxed">{p}</p>
              ))}
              {closingLine && (
                <p className="text-[14px] sm:text-[15px] text-[#D5DEE9] leading-relaxed">{closingLine}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
