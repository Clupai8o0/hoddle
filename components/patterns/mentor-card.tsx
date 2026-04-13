import Link from "next/link";
import Image from "next/image";
import { CheckCircle } from "lucide-react";
import { Tag } from "@/components/ui/tag";
import { FIELDS_OF_INTEREST } from "@/lib/validation/onboarding";

export interface MentorCardData {
  slug: string;
  headline: string | null;
  expertise: string[];
  verified_at: string | null;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    university: string | null;
    country_of_origin: string | null;
  } | null;
}

const expertiseLabel = (value: string) =>
  FIELDS_OF_INTEREST.find((f) => f.value === value)?.label ?? value;

export function MentorCard({ mentor }: { mentor: MentorCardData }) {
  const name = mentor.profiles?.full_name ?? "Mentor";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <Link
      href={`/mentors/${mentor.slug}`}
      className="group flex flex-col bg-surface-container-lowest rounded-xl overflow-hidden transition-all duration-200 hover:shadow-ambient hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
    >
      {/* Avatar / photo zone */}
      <div className="relative h-40 bg-primary-container flex items-center justify-center overflow-hidden">
        {mentor.profiles?.avatar_url ? (
          <Image
            src={mentor.profiles.avatar_url}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <span className="font-display font-bold text-5xl text-primary/30 select-none">
            {initials}
          </span>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />

        {/* Verified badge */}
        {mentor.verified_at && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-secondary text-on-secondary rounded-full px-2.5 py-1 text-[11px] font-body font-semibold">
            <CheckCircle size={11} strokeWidth={2} aria-hidden="true" />
            Verified
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-5 flex-1">
        <div>
          <p className="font-display font-semibold text-on-surface group-hover:text-primary transition-colors">
            {name}
          </p>
          {mentor.profiles?.university && (
            <p className="font-body text-xs text-on-surface-variant mt-0.5">
              {mentor.profiles.university}
            </p>
          )}
          {mentor.headline && (
            <p className="font-body text-sm text-on-surface-variant mt-2 leading-snug line-clamp-2">
              {mentor.headline}
            </p>
          )}
        </div>

        {mentor.expertise.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
            {mentor.expertise.slice(0, 3).map((tag) => (
              <Tag key={tag} variant="default" className="text-[10px] py-0.5 px-2">
                {expertiseLabel(tag)}
              </Tag>
            ))}
            {mentor.expertise.length > 3 && (
              <Tag variant="muted" className="text-[10px] py-0.5 px-2">
                +{mentor.expertise.length - 3}
              </Tag>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
