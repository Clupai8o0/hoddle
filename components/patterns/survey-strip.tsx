const C = "max-w-7xl mx-auto px-4 sm:px-10 lg:px-16";

const STATS = [
  {
    n: "72%",
    copy: "of students would trust a high-achieving peer over a professor or advisor.",
  },
  {
    n: "58%",
    copy: "have tried to approach another student for guidance — many got nowhere.",
  },
  {
    n: "39%",
    copy: "say what's missing most is honest advice from someone who's succeeded here.",
  },
] as const;

export function SurveyStrip() {
  return (
    <section className="py-20 bg-surface">
      <div className={`${C} text-center`}>
        <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-primary mb-10">
          It&rsquo;s not just Priya
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          {STATS.map(({ n, copy }) => (
            <div key={n} className="flex flex-col items-center">
              <span className="font-display font-extrabold text-6xl sm:text-7xl text-primary leading-none mb-5">
                {n}
              </span>
              <div className="h-px w-8 bg-outline-variant mb-5" aria-hidden="true" />
              <p className="font-body text-base text-on-surface-variant leading-relaxed max-w-[240px]">
                {copy}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-14 font-body text-xs uppercase tracking-widest text-on-surface-variant">
          Independent research · 80+ first-year international students · 4 Melbourne universities
        </p>
      </div>
    </section>
  );
}
