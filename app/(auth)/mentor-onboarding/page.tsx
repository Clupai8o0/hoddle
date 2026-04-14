"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { submitMentorOnboarding } from "@/lib/actions/mentor-onboarding";
import { FIELDS_OF_INTEREST } from "@/lib/validation/onboarding";
import type { MentorOnboardingData } from "@/lib/validation/mentor-onboarding";

const TOTAL_STEPS = 4;
const STEP_LABELS = ["Identity", "Your story", "Expertise", "Background"];

const STEP_INSIGHTS = [
  {
    heading: "Your first impression.",
    body: "A crisp headline and role tell students at a glance whether you're the right person to learn from.",
  },
  {
    heading: "Honesty resonates.",
    body: "Students connect most with mentors who share the specific moments — wins and failures — that shaped them.",
  },
  {
    heading: "Specificity attracts.",
    body: "Naming your expertise areas helps us match you with students who are studying exactly what you know.",
  },
  {
    heading: "Where you're from matters.",
    body: "Mentors who share a student's origin city make the strongest connections. Even a different city helps.",
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
                  !isCompleted &&
                    !isActive &&
                    "bg-surface-container-highest text-on-surface-variant",
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
                  stepNum < currentStep
                    ? "bg-secondary"
                    : "bg-surface-container-highest",
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
  const insight = STEP_INSIGHTS[step - 1]!;
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

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="font-body text-sm text-error mt-1" role="alert">
      {message}
    </p>
  );
}

export default function MentorOnboardingPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Accumulated data
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [currentPosition, setCurrentPosition] = useState("");
  const [bio, setBio] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [hometown, setHometown] = useState("");

  // Field errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  function clearError(field: string) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function advance() {
    setSubmitError(null);
    setStep((s) => s + 1);
  }

  function back() {
    setErrors({});
    setSubmitError(null);
    setStep((s) => s - 1);
  }

  function validateStep1(): boolean {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.full_name = "Full name is required.";
    else if (fullName.trim().length > 100) errs.full_name = "Keep it to 100 characters or fewer.";
    if (!headline.trim()) errs.headline = "Headline is required.";
    else if (headline.trim().length > 120) errs.headline = "Keep it to 120 characters or fewer.";
    if (!currentPosition.trim()) errs.current_position = "Current position is required.";
    else if (currentPosition.trim().length > 120) errs.current_position = "Keep it to 120 characters or fewer.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep2(): boolean {
    const errs: Record<string, string> = {};
    if (!bio.trim()) errs.bio = "Bio is required.";
    else if (bio.trim().length < 30) errs.bio = "Bio must be at least 30 characters.";
    else if (bio.trim().length > 800) errs.bio = "Bio must be 800 characters or fewer.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleStep3Next() {
    if (selectedExpertise.length === 0) {
      setErrors({ expertise: "Select at least one area." });
      return;
    }
    setErrors({});
    advance();
  }

  function toggleExpertise(value: string) {
    clearError("expertise");
    setSelectedExpertise((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : prev.length < 5
          ? [...prev, value]
          : prev,
    );
  }

  function handleFinalSubmit() {
    if (!hometown.trim()) {
      setErrors({ hometown: "Hometown is required." });
      return;
    }
    setErrors({});

    const payload: MentorOnboardingData = {
      full_name: fullName.trim(),
      headline: headline.trim(),
      current_position: currentPosition.trim(),
      bio: bio.trim(),
      expertise: selectedExpertise,
      hometown: hometown.trim(),
    };

    startTransition(async () => {
      const result = await submitMentorOnboarding(payload);
      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }
      router.push("/mentor");
    });
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-[20px] border-b border-outline-variant px-8 py-4 flex justify-between items-center">
        <span className="font-display font-bold text-lg text-primary">Hoddle</span>
        <span className="font-body text-xs text-on-surface-variant uppercase tracking-[0.15em]">
          Mentor profile — step {step} of {TOTAL_STEPS}
        </span>
      </header>

      <main className="pt-24 pb-20 px-6 max-w-5xl mx-auto">
        <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Content column */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-[var(--radius-md)] p-8 md:p-12 shadow-[0_12px_40px_rgba(0,24,66,0.08)]">

            {/* Step 1: Identity */}
            {step === 1 && (
              <>
                <header className="mb-10">
                  <h1 className="font-display font-bold text-3xl md:text-4xl text-on-surface mb-3 tracking-tight">
                    Introduce yourself.
                  </h1>
                  <p className="font-body text-on-surface-variant text-lg leading-relaxed">
                    A short headline and your current role help students decide if you're the right mentor for them.
                  </p>
                </header>
                <div className="space-y-6">
                  <div>
                    <Input
                      label="Full name"
                      placeholder="e.g. Priya Sharma"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        clearError("full_name");
                      }}
                      error={errors.full_name}
                      autoFocus
                    />
                  </div>
                  <div>
                    <Input
                      label="Headline"
                      placeholder="e.g. Senior Designer at Canva · Monash grad"
                      value={headline}
                      onChange={(e) => {
                        setHeadline(e.target.value);
                        clearError("headline");
                      }}
                      error={errors.headline}
                    />
                    <p className="font-body text-xs text-on-surface-variant mt-1.5 text-right">
                      {headline.length}/120
                    </p>
                  </div>
                  <div>
                    <Input
                      label="Current position"
                      placeholder="e.g. Product Designer at Atlassian"
                      value={currentPosition}
                      onChange={(e) => {
                        setCurrentPosition(e.target.value);
                        clearError("current_position");
                      }}
                      error={errors.current_position}
                    />
                  </div>
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      className="gap-3"
                      onClick={() => { if (validateStep1()) advance(); }}
                    >
                      Next
                      <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Bio */}
            {step === 2 && (
              <>
                <header className="mb-10">
                  <h1 className="font-display font-bold text-3xl md:text-4xl text-on-surface mb-3 tracking-tight">
                    Tell your story.
                  </h1>
                  <p className="font-body text-on-surface-variant text-lg leading-relaxed">
                    Write a bio that students will actually read. Share what brought you here and what you want to pass on.
                  </p>
                </header>
                <div className="space-y-6">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="bio"
                      className="font-body text-sm font-medium text-on-surface tracking-[0.08em] uppercase"
                    >
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      rows={7}
                      placeholder="I came to Melbourne from Mumbai to study engineering at Monash. The first semester nearly broke me — academic writing, no friends yet, and a city I didn't know. Then I found a mentor who'd done it all before…"
                      value={bio}
                      onChange={(e) => {
                        setBio(e.target.value);
                        clearError("bio");
                      }}
                      maxLength={800}
                      className={cn(
                        "w-full px-4 py-3 font-body text-base text-on-surface bg-surface-container-low rounded-md outline-none border-none ring-0 focus:ring-2 focus:ring-tertiary focus:ring-offset-0 placeholder:text-on-surface-variant/60 resize-none",
                        errors.bio && "ring-2 ring-error",
                      )}
                    />
                    <div className="flex justify-between">
                      <FieldError message={errors.bio} />
                      <p className="font-body text-xs text-on-surface-variant ml-auto">
                        {bio.length}/800
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 flex gap-3">
                    <Button type="button" variant="ghost" size="default" onClick={back}>
                      <ChevronLeft size={18} strokeWidth={1.5} aria-hidden="true" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      className="gap-3"
                      onClick={() => { if (validateStep2()) advance(); }}
                    >
                      Next
                      <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Expertise */}
            {step === 3 && (
              <>
                <header className="mb-10">
                  <h1 className="font-display font-bold text-3xl md:text-4xl text-on-surface mb-3 tracking-tight">
                    What are you an expert in?
                  </h1>
                  <p className="font-body text-on-surface-variant text-lg leading-relaxed">
                    Choose up to 5 areas. Students looking for guidance in these fields will be matched with you.
                  </p>
                </header>
                <div className="space-y-8">
                  <div className="flex flex-wrap gap-3">
                    {FIELDS_OF_INTEREST.map(({ value, label }) => (
                      <ChipButton
                        key={value}
                        label={label}
                        selected={selectedExpertise.includes(value)}
                        disabled={selectedExpertise.length >= 5}
                        onClick={() => toggleExpertise(value)}
                      />
                    ))}
                  </div>
                  <FieldError message={errors.expertise} />
                  <p className="font-body text-xs text-on-surface-variant">
                    {selectedExpertise.length}/5 selected
                  </p>
                  <div className="pt-2 flex gap-3">
                    <Button type="button" variant="ghost" size="default" onClick={back}>
                      <ChevronLeft size={18} strokeWidth={1.5} aria-hidden="true" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      className="gap-3"
                      onClick={handleStep3Next}
                    >
                      Next
                      <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Background */}
            {step === 4 && (
              <>
                <header className="mb-10">
                  <h1 className="font-display font-bold text-3xl md:text-4xl text-on-surface mb-3 tracking-tight">
                    Where are you from?
                  </h1>
                  <p className="font-body text-on-surface-variant text-lg leading-relaxed">
                    Students from the same hometown connect with you more deeply. This is shown on your public profile.
                  </p>
                </header>
                <div className="space-y-6">
                  <div>
                    <Input
                      label="Hometown"
                      placeholder="e.g. Mumbai, India"
                      value={hometown}
                      onChange={(e) => {
                        setHometown(e.target.value);
                        clearError("hometown");
                      }}
                      error={errors.hometown}
                      autoFocus
                    />
                  </div>

                  {submitError && (
                    <p className="font-body text-sm text-error" role="alert">
                      {submitError}
                    </p>
                  )}

                  <div className="pt-2 flex gap-3">
                    <Button type="button" variant="ghost" size="default" onClick={back}>
                      <ChevronLeft size={18} strokeWidth={1.5} aria-hidden="true" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      variant="hero"
                      size="lg"
                      className="gap-3"
                      disabled={isPending}
                      onClick={handleFinalSubmit}
                    >
                      {isPending ? "Setting up your profile…" : "Start mentoring"}
                      {!isPending && (
                        <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-primary rounded-[var(--radius-md)] p-8 hidden lg:block">
              <p className="font-body text-xs text-on-primary/60 uppercase tracking-[0.15em] mb-4">
                Mentor profile
              </p>
              <div className="space-y-3">
                {STEP_LABELS.map((label, i) => {
                  const isCompleted = i + 1 < step;
                  const isCurrent = i + 1 === step;
                  return (
                    <div
                      key={label}
                      className={cn(
                        "flex items-center gap-3 font-body text-sm",
                        isCurrent && "text-on-primary font-semibold",
                        isCompleted && "text-on-primary/60",
                        !isCurrent && !isCompleted && "text-on-primary/30",
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                          isCompleted && "bg-secondary",
                          isCurrent && "bg-on-primary",
                          !isCurrent && !isCompleted && "bg-on-primary/10",
                        )}
                      >
                        {isCompleted ? (
                          <Check size={10} strokeWidth={2.5} className="text-on-secondary" aria-hidden="true" />
                        ) : (
                          <span className={cn("text-[9px] font-bold", isCurrent ? "text-primary" : "text-on-primary/30")}>
                            {i + 1}
                          </span>
                        )}
                      </div>
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>
            <InsightCard step={step} />
          </div>
        </div>
      </main>
    </div>
  );
}
