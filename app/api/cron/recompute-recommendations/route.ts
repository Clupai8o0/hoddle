import { NextRequest, NextResponse } from "next/server";
import { computeRecommendationsForAllStudents } from "@/lib/matching/compute";

/**
 * Vercel cron job — runs nightly at 02:00 AEST (16:00 UTC).
 * Recomputes mentor recommendations for all onboarded students.
 *
 * Protected by CRON_SECRET header.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await computeRecommendationsForAllStudents();

  return NextResponse.json(result);
}
