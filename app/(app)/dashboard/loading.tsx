// Loading skeleton for the student dashboard.
// Uses tonal layering — no shimmer gradients.
// Mirrors the dashboard's 12-col grid: welcome banner → 8/4 split → mentors → empty states.

const C = "max-w-7xl mx-auto px-5 sm:px-10 lg:px-16";

function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`bg-surface-container-high rounded animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-surface pb-24" aria-busy="true" aria-label="Loading dashboard">

      {/* ── Welcome banner skeleton ── */}
      <section
        className="py-16 lg:py-24"
        style={{
          background:
            "linear-gradient(160deg, var(--color-surface) 0%, var(--color-primary-container) 100%)",
        }}
      >
        <div className={`${C} grid lg:grid-cols-12 gap-8 items-end`}>
          <div className="lg:col-span-8 flex flex-col gap-3">
            <SkeletonBlock className="h-3 w-24 rounded-full" />
            <SkeletonBlock className="h-6 w-40" />
            <SkeletonBlock className="h-16 w-72 lg:w-96" />
            <SkeletonBlock className="h-4 w-full max-w-md mt-1" />
            <SkeletonBlock className="h-4 w-3/4 max-w-sm" />
          </div>
          <div className="lg:col-span-4 flex flex-col gap-2 lg:items-end">
            <SkeletonBlock className="h-4 w-36" />
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </section>

      {/* ── Main grid skeleton ── */}
      <section className={`${C} mt-12 grid lg:grid-cols-12 gap-8`}>

        {/* Left: onboarding cards */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-md p-6"
              style={{ boxShadow: "var(--shadow-ambient)" }}
            >
              <SkeletonBlock className="h-3 w-32 rounded-full mb-5" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 + i }).map((_, j) => (
                  <SkeletonBlock key={j} className="h-7 w-24 rounded-full" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right: journey sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div
            className="bg-surface-container-lowest rounded-md p-6"
            style={{ boxShadow: "var(--shadow-ambient)" }}
          >
            <SkeletonBlock className="h-3 w-24 rounded-full mb-6" />
            <div className="flex flex-col gap-5">
              {(["w-36", "w-28", "w-32", "w-24", "w-20"] as const).map((w, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <SkeletonBlock className={`h-3 ${w}`} />
                    <SkeletonBlock className="h-3 w-8" />
                  </div>
                  <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-2 bg-surface-container-highest animate-pulse rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container rounded-md p-6">
            <SkeletonBlock className="h-3 w-28 rounded-full mb-5" />
            <div className="flex flex-col gap-2">
              <SkeletonBlock className="h-2 rounded-full" />
            </div>
            <SkeletonBlock className="h-3 w-full mt-5" />
            <SkeletonBlock className="h-3 w-4/5 mt-2" />
          </div>
        </div>
      </section>

      {/* ── Mentors section skeleton ── */}
      <section className={`${C} mt-20`}>
        <div className="flex items-baseline justify-between mb-8">
          <div className="flex flex-col gap-2">
            <SkeletonBlock className="h-3 w-24 rounded-full" />
            <SkeletonBlock className="h-7 w-56" />
          </div>
          <SkeletonBlock className="h-7 w-28 rounded-full" />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-container-lowest rounded-md overflow-hidden">
              <div className="h-44 bg-surface-container-high animate-pulse" />
              <div className="p-5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <SkeletonBlock className="h-8 w-8 rounded-full" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <SkeletonBlock className="h-3.5 w-24" />
                    <SkeletonBlock className="h-3 w-36" />
                  </div>
                </div>
                <SkeletonBlock className="h-3 w-full" />
                <SkeletonBlock className="h-3 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Empty states skeleton ── */}
      <section className={`${C} mt-16`}>
        <div className="mb-8 flex flex-col gap-2">
          <SkeletonBlock className="h-3 w-20 rounded-full" />
          <SkeletonBlock className="h-7 w-40" />
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-container-low rounded-md overflow-hidden">
              <div className="h-36 bg-surface-container animate-pulse" />
              <div className="p-5 flex flex-col gap-2">
                <SkeletonBlock className="h-6 w-16 rounded-full mb-1" />
                <SkeletonBlock className="h-5 w-32" />
                <SkeletonBlock className="h-3 w-full" />
                <SkeletonBlock className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
