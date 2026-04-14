import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { acceptMentorInvite } from "@/lib/actions/mentor-invites";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token = searchParams.get("token");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}`,
    );
  }

  // token is required; code may be absent when Supabase uses implicit flow
  // (access_token arrives in the hash fragment, which servers never see).
  // In that case, hand off to /auth/confirm which handles the hash client-side.
  if (!token) {
    return NextResponse.redirect(`${origin}/login?error=missing_params`);
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth/confirm?token=${encodeURIComponent(token)}`,
    );
  }

  const supabase = await createClient();
  const { data, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.user) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(exchangeError?.message ?? "auth_failed")}`,
    );
  }

  // Accept the invite — sets role, creates mentor row, marks invite accepted
  const result = await acceptMentorInvite(token);

  if (!result.ok) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(result.error)}`,
    );
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
