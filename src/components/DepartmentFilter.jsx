import { departments } from '../data/departments';

export default function DepartmentFilter({ value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2 -mx-1 px-1 flex-wrap">
      {departments.map((dept) => {
        const active = value === dept.id;
        return (
          <button
            key={dept.id}
            onClick={() => onChange(dept.id)}
            className={`flex-shrink-0 whitespace-nowrap flex items-center gap-1.5 font-bold text-[13px] px-3.5 py-2 rounded-full border-[1.5px] transition-colors ${
              active ? 'bg-brand border-brand text-white' : 'bg-[#F6F8FB] dark:bg-[#131E2F] border-border text-body-strong hover:border-brand/50'
            }`}
          >
            <span>{dept.icon}</span>
            {dept.name}
          </button>
        );
      })}
    </div>
  );
}
