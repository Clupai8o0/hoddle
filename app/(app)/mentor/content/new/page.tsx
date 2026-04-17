import { ContentForm } from "@/app/(app)/mentor/content/content-form";

export const metadata = { title: "New Content — Hoddle" };

export default function NewContentPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-1">
          Content
        </p>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">New article</h1>
        <p className="font-body text-sm text-on-surface-variant mt-2">
          Write a guide, embed a video, or attach a downloadable resource for students.
        </p>
      </header>

      <ContentForm />
    </div>
  );
}
