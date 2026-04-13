"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sessionQuestionSchema, type SessionQuestionInput } from "@/lib/validation/session-question";
import { submitSessionQuestion } from "@/lib/actions/session-questions";
import { Button } from "@/components/ui/button";

interface QuestionFormProps {
  sessionId: string;
}

export function QuestionForm({ sessionId }: QuestionFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SessionQuestionInput>({
    resolver: zodResolver(sessionQuestionSchema),
    defaultValues: { session_id: sessionId, anonymous: false, body: "" },
  });

  const body = watch("body");

  async function onSubmit(data: SessionQuestionInput) {
    setServerError(null);
    const result = await submitSessionQuestion(data);
    if (result.ok) {
      setSubmitted(true);
    } else {
      setServerError(result.error);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl bg-secondary/10 px-5 py-6 text-center">
        <p className="font-display font-semibold text-secondary text-base mb-1">
          Question received
        </p>
        <p className="font-body text-sm text-on-surface-variant">
          The mentor will answer it during the session.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <input type="hidden" {...register("session_id")} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="question-body" className="font-body text-sm font-medium text-on-surface">
          Your question
        </label>
        <textarea
          id="question-body"
          rows={4}
          placeholder="What would you like to ask?"
          className="w-full rounded-lg border border-outline/30 bg-surface px-4 py-3 font-body text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          {...register("body")}
        />
        <div className="flex justify-between items-center">
          {errors.body ? (
            <p className="font-body text-xs text-error">{errors.body.message}</p>
          ) : (
            <span />
          )}
          <p className="font-body text-xs text-on-surface-variant ml-auto">
            {body?.length ?? 0}/500
          </p>
        </div>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-outline/30 accent-primary"
          {...register("anonymous")}
        />
        <span className="font-body text-sm text-on-surface-variant">
          Ask anonymously
        </span>
      </label>

      {serverError && (
        <p className="font-body text-sm text-error">{serverError}</p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Sending…" : "Submit question"}
      </Button>
    </form>
  );
}
