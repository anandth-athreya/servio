import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.auth.exchangeCodeForSession(code);

    // Handle password recovery callback — redirect to reset password step
    if (type === "recovery") {
      return NextResponse.redirect(`${requestUrl.origin}/forgot-password?step=reset`);
    }

    // Default: redirect to explore (logged-in users)
    return NextResponse.redirect(`${requestUrl.origin}/explore`);
  }

  return NextResponse.redirect(`${requestUrl.origin}/login`);
}
