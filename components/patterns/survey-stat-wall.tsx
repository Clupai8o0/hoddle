const C = "max-w-7xl mx-auto px-4 sm:px-10 lg:px-16";

type StatCard = {
  stat: string;
  interpretation: string;
  bg: string;
  numColor: string;
  ruleColor: string;
  copyColor: string;
};

const STATS: StatCard[] = [
  {
    stat: "72%",
    interpretation:
      "of international students would trust a high-achieving peer over any professor, advisor, or counsellor.",
    bg: "bg-surface-container",
    numColor: "text-primary",
    ruleColor: "bg-primary",
    copyColor: "text-on-surface-variant",
  },
  {
    stat: "58% + 9.7%",
    interpretation:
      "have tried approaching another student for guidance — and one in ten got nowhere.",
    bg: "bg-secondary-container",
    numColor: "text-on-secondary-container",
    ruleColor: "bg-secondary",
    copyColor: "text-on-secondary-container/80",
  },
  {
    stat: "39%",
    interpretation:
      "say the missing piece is honest advice from someone who has already succeeded here.",
    bg: "bg-primary-container",
    numColor: "text-on-primary-container",
    ruleColor: "bg-primary",
    copyColor: "text-on-primary-container/80",
  },
  {
    stat: "Career. Academics.",
    interpretation:
      "the two goals tied for #1 in every cohort we spoke to — everything else came second.",
    bg: "bg-surface-container-highest",
    numColor: "text-primary",
    ruleColor: "bg-primary",
    copyColor: "text-on-surface-variant",
  },
];

export function SurveyStatWall() {
  return (
    <section className="py-28 bg-surface-container-low">
      <div className={`${C} grid lg:grid-cols-12 gap-10 sm:gap-16 items-start`}>
        {/* Left column — sticky intro */}
        <div className="lg:col-span-5 lg:sticky lg:top-28">
          <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-4">
            The research
          </p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-on-surface tracking-tight leading-[1.1] mb-6">
            Built on what students
            <br />
            actually told us.
          </h2>
          <p className="font-body text-lg text-on-surface-variant leading-relaxed">
            We spent two semesters listening. Eighty first-year international
            students. Four Melbourne universities. Dozens of repeating patterns
            — all pointing to the same missing piece.
          </p>
        </div>

        {/* Right column — stat cards */}
        <div className="lg:col-span-7 grid grid-cols-1 gap-5">
          {STATS.map(({ stat, interpretation, bg, numColor, ruleColor, copyColor }) => (
            <div key={stat} className={`${bg} rounded-2xl p-8 lg:p-10`}>
              <p className={`font-display font-extrabold text-5xl lg:text-6xl ${numColor} leading-none mb-4`}>
                {stat}
              </p>
              <div className={`h-1 w-12 ${ruleColor} rounded-full mb-5`} aria-hidden="true" />
              <p className={`font-body text-base lg:text-lg ${copyColor} leading-relaxed`}>
                {interpretation}
              </p>
            </div>
          ))}

          <p className="mt-4 font-body text-xs uppercase tracking-widest text-on-surface-variant">
            Methodology · 80 semi-structured interviews · 4 Melbourne universities
          </p>
        </div>
      </div>
    </section>
  );
}
