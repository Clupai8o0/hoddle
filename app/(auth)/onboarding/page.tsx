"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, ChevronLeft } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { submitOnboarding } from "@/lib/actions/onboarding";
import {
  step1Schema,
  step2Schema,
  GOALS,
  CHALLENGES,
  FIELDS_OF_INTEREST,
  UNIVERSITIES,
  COUNTRIES,
  type OnboardingData,
} from "@/lib/validation/onboarding";

type Step1Fields = z.infer<typeof step1Schema>;
type Step2Fields = z.infer<typeof step2Schema>;

const TOTAL_STEPS = 5;

const STEP_LABELS = ["Name", "Background", "Goals", "Challenges", "Interests"];

// Insight card content per step
const STEP_INSIGHTS = [
  {
    heading: "You belong here.",
    body: "Every mentor on Hoddle was once exactly where you are. Your path has already begun.",
  },
  {
    heading: "Context is everything.",
    body: "Knowing where you're from helps us match you with mentors who truly understand your journey.",
  },
  {
    heading: "Goals shape your matches.",
    body: "Mentors specialise in specific outcomes. Naming yours means we can connect you with the right voice.",
  },
  {
    heading: "You're not alone.",
    body: "Most international students share the same challenges. Naming them is the first step to overcoming them.",
  },
  {
    heading: "Curiosity is a superpower.",
    body: "Your field of interest helps us surface the most relevant stories, advice, and mentors for your journey.",
  },
];

function StepIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <div key={stepNum} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  isCompleted &&
                    "bg-secondary text-on-secondary shadow-[0_4px_12px_rgba(45,106,79,0.25)]",
                  isActive &&
                    "bg-primary text-on-primary shadow-[0_4px_12px_rgba(0,24,66,0.30)] ring-4 ring-primary-container",
                  !isCompleted && !isActive && "bg-surface-container-highest text-on-surface-variant",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {isCompleted ? (
                  <Check size={16} strokeWidth={2} aria-hidden="true" />
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-body uppercase tracking-[0.12em] font-medium",
                  isActive && "text-primary",
                  isCompleted && "text-secondary",
                  !isCompleted && !isActive && "text-on-surface-variant/50",
                )}
              >
                {STEP_LABELS[i]}
              </span>
            </div>
            {i < totalSteps - 1 && (
              <div
                className={cn(
                  "h-0.5 w-10 sm:w-16 mx-1 mb-5 rounded-full transition-colors",
                  stepNum < currentStep ? "bg-secondary" : "bg-surface-container-highest",
                )}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChipButton({
  label,
  selected,
  onClick,
  disabled,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled && !selected}
      aria-pressed={selected}
      className={cn(
        "px-4 py-2.5 rounded-full font-body text-sm font-medium transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        selected
          ? "bg-primary text-on-primary shadow-[0_4px_12px_rgba(0,24,66,0.20)]"
          : "bg-surface-container-high text-on-surface hover:bg-primary-container hover:text-on-primary-container",
        disabled && !selected && "opacity-40 cursor-not-allowed",
      )}
    >
      {label}
    </button>
  );
}

function InsightCard({ step }: { step: number }) {
  const insight = STEP_INSIGHTS[step - 1];
  return (
    <div className="bg-secondary-container rounded-[var(--radius-md)] p-6 mt-auto">
      <h4 className="font-display font-bold text-on-secondary-container mb-2">
        {insight.heading}
      </h4>
      <p className="font-body text-sm text-on-secondary-container/80 leading-relaxed">
        {insight.body}
      </p>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Accumulated data across all steps
  const [accumulated, setAccumulated] = useState<Partial<OnboardingData>>({});

  // Chip selections (steps 3–5)
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [chipError, setChipError] = useState<string | null>(null);

  // Step 1 form
  const step1Form = useForm<Step1Fields>({
    resolver: zodResolver(step1Schema),
    defaultValues: { full_name: accumulated.full_name ?? "" },
  });

  // Step 2 form
  const step2Form = useForm<Step2Fields>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      country_of_origin: accumulated.country_of_origin ?? "",
      university: accumulated.university ?? "",
    },
  });

  function advance() {
    setChipError(null);
    setSubmitError(null);
    setStep((s) => s + 1);
  }

  function back() {
    setChipError(null);
    setSubmitError(null);
    setStep((s) => s - 1);
  }

  function handleStep1(data: Step1Fields) {
    setAccumulated((prev) => ({ ...prev, ...data }));
    advance();
  }

  function handleStep2(data: Step2Fields) {
    setAccumulated((prev) => ({ ...prev, ...data }));
    advance();
  }

  function handleChipNext(
    stepNum: 3 | 4 | 5,
    selected: string[],
    maxLabel: string,
  ) {
    if (selected.length === 0) {
      setChipError("Select at least one option to continue.");
      return;
    }
    if (stepNum === 3) setAccumulated((p) => ({ ...p, goals: selected }));
    if (stepNum === 4) setAccumulated((p) => ({ ...p, challenges: selected }));
    if (stepNum === 5)
      setAccumulated((p) => ({ ...p, fields_of_interest: selected }));
    advance();
  }

  function toggleChip(
    value: string,
    selected: string[],
    setSelected: (v: string[]) => void,
  ) {
    setChipError(null);
    if (selected.includes(value)) {
      setSelected(selected.filter((v) => v !== value));
    } else if (selected.length < 3) {
      setSelected([...selected, value]);
    }
  }

  const insight = STEP_INSIGHTS[step - 1];

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-[20px] border-b border-outline-variant px-8 py-4 flex justify-between items-center">
        <span className="font-display font-bold text-lg text-primary">
          Hoddle
        </span>
        <span className="font-body text-xs text-on-surface-variant uppercase tracking-[0.15em]">
          Step {step} of {TOTAL_STEPS}
        </span>
      </header>

      <main className="pt-24 pb-20 px-6 max-w-5xl mx-auto">
        <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* ── Content column ── */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-[var(--radius-md)] p-8 md:p-12 shadow-[0_12px_40px_rgba(0,24,66,0.08)]">

            {/* ── Step 1: Name ── */}
            {step === 1 && (
              <>
                <header className="mb-10">
                  <h1 className="font-display font-bold text-3xl md:text-4xl text-on-surface mb-3 tracking-tight">
                    What should we call you?
                  </h1>
                  <p className="font-body text-on-surface-variant text-lg leading-relaxed">
                    Your mentor will use this to greet you personally.
                  </p>
                </header>
                <form
                  onSubmit={step1Form.handleSubmit(handleStep1)}
                  className="space-y-8"
                  noValidate
                >
                  <Input
                    label="Full name"
                    placeholder="e.g. Priya Sharma"
                    autoFocus
                    autoComplete="name"
                    error={step1Form.formState.errors.full_name?.message}
                    {...step1Form.register("full_name")}
                  />
                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="gap-3"
                    >
                      Next
                      <ArrowRight
                        size={18}
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </Button>
                  </div>
                </form>
              </>
            )}

            {/* ── Step 2: Background ── */}
            {step === 2 && (
              <>
                <header className="mb-10">
                  <h1 className="font-display font-bold text-3xl md:text-4xl text-on-surface mb-3 tracking-tight">
                    Tell us about your journey.
                  </h1>
                  <p className="font-body text-on-surface-variant text-lg leading-relaxed">
                    We use these details to pair you with a mentor who truly
                    understands your path in Melbourne.
                  </p>
                </header>
                <form
                  onSubmit={step2Form.handleSubmit(handleStep2)}
                  className="space-y-8"
                  noValidate
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="country_of_origin"
                        className="font-body text-sm font-medium text-on-surface tracking-[0.08em] uppercase"
                      >
                        Country of origin
                      </label>
                      <select
                        id="country_of_origin"
                        className={cn(
                          "min-h-[56px] px-4 py-3 font-body text-base text-on-surface bg-surface-container-low rounded-md outline-none border-none ring-0 focus:ring-2 focus:ring-tertiary",
                          step2Form.formState.errors.country_of_origin &&
                            "ring-2 ring-error",
                        )}
                        {...step2Form.register("country_of_origin")}
                      >
                        <option value="">Select your country</option>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      {step2Form.formState.errors.country_of_origin && (
                        <p className="font-body text-sm text-error mt-0.5" role="alert">
                          {step2Form.formState.errors.country_of_origin.message}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="university"
                        className="font-body text-sm font-medium text-on-surface tracking-[0.08em] uppercase"
                      >
                        University
                      </label>
                      <select
                        id="university"
                        className={cn(
                          "min-h-[56px] px-4 py-3 font-body text-base text-on-surface bg-surface-container-low rounded-md outline-none border-none ring-0 focus:ring-2 focus:ring-tertiary",
                          step2Form.formState.errors.university &&
                            "ring-2 ring-error",
                        )}
                        {...step2Form.register("university")}
                      >
                        <option value="">Select your university</option>
                        {UNIVERSITIES.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                      {step2Form.formState.errors.university && (
                        <p className="font-body text-sm text-error mt-0.5" role="alert">
                          {step2Form.formState.errors.university.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="default"
                      onClick={back}
                    >
                      <ChevronLeft size={18} strokeWidth={1.5} aria-hidden="true" />
                      Back
                    </Button>
                    <Button type="submit" variant="primary" size="lg" className="gap-3">
                      Next
                      <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
                    </Button>
                  </div>
                </form>
              </>
            )}

            {/* ── Step 3: Goals ── */}
            {step === 3 && (
              <>
                <header className="mb-10">
                  <h1 className="font-display font-bold text-3xl md:text-4xl text-on-surface mb-3 tracking-tight">
                    What are your top goals?
                  </h1>
                  <p className="font-body text-on-surface-variant text-lg leading-relaxed">
                    Choose up to 3. These shape the mentors and content we show
                    you.
                  </p>
                </header>
                <div className="space-y-8">
                  <div className="flex flex-wrap gap-3">
                    {GOALS.map(({ value, label }) => (
                      <ChipButton
                        key={value}
                        label={label}
                        selected={selectedGoals.includes(value)}
                        disabled={selectedGoals.length >= 3}
                        onClick={() =>
                          toggleChip(value, selectedGoals, setSelectedGoals)
                        }
                      />
                    ))}
                  </div>
                  {chipError && (
                    <p className="font-body text-sm text-error" role="alert">
                      {chipError}
                    </p>
                  )}
                  <p className="font-body text-xs text-on-surface-variant">
                    {selectedGoals.length}/3 selected
                  </p>
                  <div className="pt-2 flex gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="default"
                      onClick={back}
                    >
                      <ChevronLeft size={18} strokeWidth={1.5} aria-hidden="true" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      className="gap-3"
                      onClick={() =>
                        handleChipNext(3, selectedGoals, "3 goals")
                      }
                    >
                      Next
                      <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* ── Step 4: Challenges ── */}
            {step === 4 && (
              <>
                <header className="mb-10">
                  <h1 className="font-display font-bold text-3xl md:text-4xl text-on-surface mb-3 tracking-tight">
                    What are your biggest challenges?
                  </h1>
                  <p className="font-body text-on-surface-variant text-lg leading-relaxed">
                    Choose up to 3. Your mentor has likely faced these too.
                  </p>
                </header>
                <div className="space-y-8">
                  <div className="flex flex-wrap gap-3">
                    {CHALLENGES.map(({ value, label }) => (
                      <ChipButton
                        key={value}
                        label={label}
                        selected={selectedChallenges.includes(value)}
                        disabled={selectedChallenges.length >= 3}
                        onClick={() =>
                          toggleChip(
                            value,
                            selectedChallenges,
                            setSelectedChallenges,
                          )
                        }
                      />
                    ))}
                  </div>
                  {chipError && (
                    <p className="font-body text-sm text-error" role="alert">
                      {chipError}
                    </p>
                  )}
                  <p className="font-body text-xs text-on-surface-variant">
                    {selectedChallenges.length}/3 selected
                  </p>
                  <div className="pt-2 flex gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="default"
                      onClick={back}
                    >
                      <ChevronLeft size={18} strokeWidth={1.5} aria-hidden="true" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      className="gap-3"
                      onClick={() =>
                        handleChipNext(
                          4,
                          selectedChallenges,
                          "3 challenges",
                        )
                      }
                    >
                      Next
                      <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* ── Step 5: Fields of interest ── */}
            {step === 5 && (
              <>
                <header className="mb-10">
                  <h1 className="font-display font-bold text-3xl md:text-4xl text-on-surface mb-3 tracking-tight">
                    What are you studying?
                  </h1>
                  <p className="font-body text-on-surface-variant text-lg leading-relaxed">
                    Choose up to 3 fields. We&apos;ll match you with mentors in
                    your space.
                  </p>
                </header>
                <div className="space-y-8">
                  <div className="flex flex-wrap gap-3">
                    {FIELDS_OF_INTEREST.map(({ value, label }) => (
                      <ChipButton
                        key={value}
                        label={label}
                        selected={selectedFields.includes(value)}
                        disabled={selectedFields.length >= 3}
                        onClick={() =>
                          toggleChip(value, selectedFields, setSelectedFields)
                        }
                      />
                    ))}
                  </div>
                  {chipError && (
                    <p className="font-body text-sm text-error" role="alert">
                      {chipError}
                    </p>
                  )}
                  <p className="font-body text-xs text-on-surface-variant">
                    {selectedFields.length}/3 selected
                  </p>

                  {submitError && (
                    <p className="font-body text-sm text-error" role="alert">
                      {submitError}
                    </p>
                  )}

                  <div className="pt-2 flex gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="default"
                      onClick={back}
                    >
                      <ChevronLeft size={18} strokeWidth={1.5} aria-hidden="true" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      variant="hero"
                      size="lg"
                      className="gap-3"
                      disabled={isPending}
                      onClick={() => {
                        if (selectedFields.length === 0) {
                          setChipError("Select at least one option to continue.");
                          return;
                        }
                        setChipError(null);
                        // Build final payload directly to avoid stale state closure
                        const finalData = {
                          ...accumulated,
                          fields_of_interest: selectedFields,
                        };
                        setSubmitError(null);
                        startTransition(async () => {
                          const result = await submitOnboarding(finalData);
                          if (!result.ok) {
                            setSubmitError(result.error);
                            return;
                          }
                          router.push("/dashboard");
                        });
                      }}
                    >
                      {isPending ? "Saving…" : "Find my mentors"}
                      {!isPending && (
                        <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Editorial sidebar ── */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="relative rounded-[var(--radius-md)] overflow-hidden aspect-[4/3] hidden lg:block">
              <Image
                src="/images/onboarding-step-illustration.webp"
                alt=""
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,24,66,0.20)_0%,transparent_100%)]" />
              <div className="absolute inset-0 flex items-end p-8">
                <p className="font-display text-on-primary/90 italic text-xl font-light leading-relaxed">
                  {insight.heading}
                </p>
              </div>
            </div>

            <InsightCard step={step} />
          </div>
        </div>
      </main>
    </div>
  );
}
