import Link from "next/link";
import { Container } from "@/components/ui/container";
import { AdminMentorForm } from "../admin-mentor-form";

export default function NewMentorPage() {
  return (
    <Container className="py-10 sm:py-16">
      <div className="max-w-2xl">
        <nav className="font-body text-sm text-on-surface-variant mb-3">
          <Link href="/admin" className="hover:text-primary transition-colors">
            Admin
          </Link>
          {" / "}
          <Link
            href="/admin/mentors"
            className="hover:text-primary transition-colors"
          >
            Mentors
          </Link>
          {" / "}
          <span className="text-on-surface">New</span>
        </nav>

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-primary mb-2">
          Create a mentor
        </h1>
        <p className="font-body text-on-surface-variant text-base sm:text-lg mb-8 sm:mb-10">
          Create a full mentor account. They can log in later via magic link to
          their email.
        </p>

        <AdminMentorForm mode="create" />
      </div>
    </Container>
  );
}
