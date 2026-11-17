import { Check, FileText, Home, Search, Send, Sparkles, Briefcase } from 'lucide-react';

/**
 * A static picture of the Jobora workspace for the landing page.
 * Uses real interface labels and generic role titles only: no companies,
 * people or numbers that could be mistaken for live data.
 */
const NAV = [
  { icon: Home, label: 'Home' },
  { icon: Search, label: 'Jobs', active: true },
  { icon: Send, label: 'Applications' },
  { icon: FileText, label: 'CV' },
  { icon: Briefcase, label: 'Career Ops' },
  { icon: Sparkles, label: 'Copilot' },
];

const ROLES = [
  { title: 'Frontend Developer', skills: ['React', 'TypeScript', 'GraphQL'], have: 2 },
  { title: 'Product Designer', skills: ['Figma', 'Research', 'Prototyping'], have: 3 },
  { title: 'Data Analyst', skills: ['SQL', 'Python', 'Tableau'], have: 1 },
];

const BOARD = [
  { label: 'Saved', tone: 'bg-plum', cards: 2 },
  { label: 'Applied', tone: 'bg-coral', cards: 2 },
  { label: 'Interview', tone: 'bg-success', cards: 1 },
];

export function AppScreen() {
  return (
    // Every size is in em, so the whole screen scales with this one font size.
    <div className="flex h-full text-[clamp(5px,1.05vw,11px)] leading-tight text-ink">
      {/* Sidebar */}
      <div className="flex w-[19%] flex-col gap-[0.4em] border-r border-line bg-ivory p-[1.2em]">
        <div className="mb-[0.8em] flex items-center gap-[0.5em]">
          <span className="flex h-[1.8em] w-[1.8em] items-center justify-center rounded-[0.4em] bg-plum font-bold text-coral">J</span>
          <span className="font-bold text-plum">Jobora</span>
        </div>
        {NAV.map(({ icon: Icon, label, active }) => (
          <span
            key={label}
            className={`flex items-center gap-[0.6em] rounded-[0.5em] px-[0.6em] py-[0.5em] font-medium ${
              active ? 'bg-plum text-paper' : 'text-ink-muted'
            }`}
          >
            <Icon className="h-[1.1em] w-[1.1em]" />
            {label}
          </span>
        ))}
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col gap-[1em] bg-paper p-[1.4em]">
        <div className="flex items-center justify-between">
          <span className="font-serif text-[1.7em] text-plum">Jobs</span>
          <span className="flex w-[45%] items-center gap-[0.5em] rounded-full border border-line bg-ivory px-[0.9em] py-[0.45em] text-ink-subtle">
            <Search className="h-[1em] w-[1em]" /> Search roles, skills or places
          </span>
        </div>

        <div className="grid flex-1 grid-cols-[1.15fr_1fr] gap-[1.2em]">
          {/* Role list with skill-by-skill match */}
          <div className="flex flex-col gap-[0.7em]">
            {ROLES.map((r) => (
              <div key={r.title} className="flex-1 rounded-[0.7em] border border-line bg-paper p-[0.9em] shadow-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-plum">{r.title}</p>
                    <p className="mt-[0.2em] text-ink-subtle">Remote · Full time</p>
                  </div>
                  <span className="rounded-full bg-plum-50 px-[0.6em] py-[0.2em] font-semibold text-plum">Save</span>
                </div>
                <div className="mt-[0.7em] flex flex-wrap gap-[0.35em]">
                  {r.skills.map((s, i) => (
                    <span
                      key={s}
                      className={`flex items-center gap-[0.25em] rounded-full px-[0.55em] py-[0.2em] font-medium ${
                        i < r.have ? 'bg-success-100 text-success-700' : 'border border-dashed border-line text-ink-subtle'
                      }`}
                    >
                      {i < r.have && <Check className="h-[0.9em] w-[0.9em]" />}
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Application board */}
          <div className="flex flex-col rounded-[0.7em] border border-line bg-ivory p-[0.9em]">
            <p className="mb-[0.7em] font-semibold text-plum">Applications</p>
            <div className="grid flex-1 grid-cols-3 gap-[0.6em]">
              {BOARD.map((col) => (
                <div key={col.label} className="flex flex-col gap-[0.5em]">
                  <span className="flex items-center gap-[0.35em] font-semibold text-ink-muted">
                    <span className={`h-[0.6em] w-[0.6em] rounded-full ${col.tone}`} />
                    {col.label}
                  </span>
                  {Array.from({ length: col.cards }).map((_, i) => (
                    <div key={i} className="rounded-[0.5em] border border-line bg-paper p-[0.6em] shadow-card">
                      <span className={`block h-[0.35em] w-[40%] rounded-full ${col.tone}`} />
                      <span className="mt-[0.5em] block h-[0.45em] w-[85%] rounded-full bg-ink/60" />
                      <span className="mt-[0.35em] block h-[0.4em] w-[55%] rounded-full bg-ink/20" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
