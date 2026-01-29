interface ChangelogEntry {
  version: string
  date: string
  type: 'major' | 'minor' | 'patch'
  changes: {
    added?: Array<string>
    changed?: Array<string>
    fixed?: Array<string>
  }
}

const CHANGELOG_DATA: Array<ChangelogEntry> = [
  {
    version: 'v1.0.0',
    date: 'January 15, 2026',
    type: 'major',
    changes: {
      added: [
        'Lorem ipsum dolor sit amet consectetur adipiscing elit',
        'Sed do eiusmod tempor incididunt ut labore',
        'Ut enim ad minim veniam quis nostrud exercitation',
        'Ullamco laboris nisi ut aliquip ex ea commodo',
        'Duis aute irure dolor in reprehenderit',
      ],
    },
  },
  {
    version: 'v0.9.5',
    date: 'December 20, 2025',
    type: 'minor',
    changes: {
      added: [
        'Voluptate velit esse cillum dolore eu fugiat',
        'Nulla pariatur excepteur sint occaecat',
      ],
      changed: [
        'Cupidatat non proident sunt in culpa',
        'Qui officia deserunt mollit anim id est',
      ],
      fixed: [
        'Laborum et dolorum fuga et harum',
        'Quidem rerum facilis est et expedita',
      ],
    },
  },
  {
    version: 'v0.9.0',
    date: 'November 10, 2025',
    type: 'minor',
    changes: {
      added: [
        'Distinctio nam libero tempore cum soluta',
        'Nobis est eligendi optio cumque nihil',
        'Impedit quo minus id quod maxime',
      ],
    },
  },
]

export function ChangelogList() {
  return (
    <section
      className="py-20 px-6 lg:px-12 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-landing-page)' }}
    >
      <div className="max-w-4xl mx-auto relative z-10 space-y-20">
        {CHANGELOG_DATA.map((entry) => (
          <div
            key={entry.version}
            className="grid md:grid-cols-12 gap-8 items-start"
          >
            {/* Version Info */}
            <div className="md:col-span-3 sticky top-32">
              <div className="flex flex-col items-start gap-2">
                <h2
                  className="text-3xl font-bold font-mono tracking-tight"
                  style={{
                    color: 'var(--text-landing-primary)',
                  }}
                >
                  {entry.version}
                </h2>
                <time
                  className="text-sm font-mono"
                  style={{
                    color: 'var(--text-landing-secondary)',
                  }}
                >
                  {entry.date}
                </time>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider mt-2 border ${
                    entry.type === 'major'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : entry.type === 'minor'
                        ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        : 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20'
                  }`}
                >
                  {entry.type} Release
                </span>
              </div>
            </div>

            {/* Changes */}
            <div className="md:col-span-9 space-y-8">
              {entry.changes.added && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-emerald-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    New Features
                  </h3>
                  <ul className="space-y-3">
                    {entry.changes.added.map((item, i) => (
                      <li
                        key={i}
                        className="flex gap-3 text-base leading-relaxed"
                        style={{
                          color: 'var(--text-landing-primary)',
                        }}
                      >
                        <span>•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {entry.changes.changed && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-amber-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Improvements
                  </h3>
                  <ul className="space-y-3">
                    {entry.changes.changed.map((item, i) => (
                      <li
                        key={i}
                        className="flex gap-3 text-base leading-relaxed"
                        style={{
                          color: 'var(--text-landing-primary)',
                        }}
                      >
                        <span>•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {entry.changes.fixed && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-rose-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Bug Fixes
                  </h3>
                  <ul className="space-y-3">
                    {entry.changes.fixed.map((item, i) => (
                      <li
                        key={i}
                        className="flex gap-3 text-base leading-relaxed"
                        style={{
                          color: 'var(--text-landing-primary)',
                        }}
                      >
                        <span>•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
