"use client";

import { useState, useRef } from "react";
import { CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { submitMentorApplication } from "@/lib/actions/mentor-application";
import { cn } from "@/lib/utils/cn";

type Field = {
  name: string;
  label: string;
  placeholder: string;
  hint?: string;
  required?: boolean;
  type?: string;
};

const FIELDS: Field[] = [
  {
    name: "full_name",
    label: "Full name",
    placeholder: "Your full name",
    required: true,
  },
  {
    name: "email",
    label: "Email address",
    placeholder: "you@example.com",
    type: "email",
    required: true,
  },
  {
    name: "university",
    label: "University or institution",
    placeholder: "e.g. University of Melbourne",
    required: true,
  },
  {
    name: "field_of_study",
    label: "Field of study or current role",
    placeholder: "e.g. Commerce, third year",
    required: true,
  },
  {
    name: "country_of_origin",
    label: "Where are you from?",
    placeholder: "e.g. Vietnam",
    hint: "Mentors are matched with students who share their background.",
    required: true,
  },
  {
    name: "years_in_melbourne",
    label: "How long have you been in Melbourne?",
    placeholder: "e.g. 2 years",
  },
  {
    name: "linkedin_url",
    label: "LinkedIn or personal website",
    placeholder: "https://linkedin.com/in/yourname",
    type: "url",
  },
];

export function ApplyForm() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function set(name: string, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setIsPending(true);

    const result = await submitMentorApplication(values);
    setIsPending(false);

    if (!result.ok) {
      // Surface field-level errors from zod if we can detect the field name
      const msg = result.error;
      const fieldMatch = FIELDS.find((f) =>
        msg.toLowerCase().includes(f.label.toLowerCase().split(" ")[0]!.toLowerCase()),
      );
      if (fieldMatch) {
        setErrors((e) => ({ ...e, [fieldMatch.name]: msg }));
      } else {
        setServerError(msg);
      }
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-start gap-6 py-4">
        <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
          <CheckCircle size={22} strokeWidth={1.5} className="text-secondary" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display font-bold text-2xl text-on-surface mb-2">
            Application received.
          </h2>
          <p className="font-body text-on-surface-variant text-base leading-relaxed max-w-md">
            Thank you — our team reviews every application and will be in touch
            via email within a few days.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {FIELDS.map(({ name, label, placeholder, hint, required, type }) => (
          <div key={name} className={cn(name === "motivation" && "sm:col-span-2")}>
            <Input
              type={type ?? "text"}
              label={label}
              placeholder={placeholder}
              hint={hint}
              required={required}
              value={values[name] ?? ""}
              onChange={(e) => set(name, e.target.value)}
              error={errors[name]}
              autoComplete="off"
            />
          </div>
        ))}

        {/* Motivation textarea */}
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label
            htmlFor="motivation"
            className="font-body text-sm font-medium text-on-surface tracking-[0.08em] uppercase"
          >
            Why do you want to mentor?{" "}
            <span className="text-error" aria-hidden="true">*</span>
          </label>
          <textarea
            id="motivation"
            name="motivation"
            required
            rows={5}
            placeholder="Tell us about your first year in Melbourne and what you wish you'd known. What challenges did you overcome that you could help others with?"
            value={values.motivation ?? ""}
            onChange={(e) => set("motivation", e.target.value)}
            className={cn(
              "w-full px-4 py-3 resize-none",
              "font-body text-base text-on-surface",
              "bg-surface-container-low rounded-md",
              "outline-none border-none ring-0",
              "focus:ring-2 focus:ring-tertiary focus:ring-offset-0",
              "placeholder:text-on-surface-variant/60",
              errors.motivation && "ring-2 ring-error",
            )}
            aria-invalid={errors.motivation ? "true" : undefined}
            aria-describedby={errors.motivation ? "motivation-error" : "motivation-hint"}
          />
          {errors.motivation ? (
            <p id="motivation-error" className="font-body text-sm text-error mt-0.5" role="alert">
              {errors.motivation}
            </p>
          ) : (
            <p id="motivation-hint" className="font-body text-sm text-on-surface-variant mt-0.5">
              Minimum 80 characters. Be specific — your story is what gets you matched.
            </p>
          )}
        </div>
      </div>

      {serverError && (
        <p className="font-body text-sm text-error" role="alert">
          {serverError}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full sm:w-auto"
        disabled={isPending}
      >
        {isPending ? "Submitting…" : "Submit application →"}
      </Button>
    </form>
  );
}
