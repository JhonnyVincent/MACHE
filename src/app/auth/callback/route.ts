import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  // Si pas de code → erreur login
  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", requestUrl.origin)
    );
  }

  const supabase = await createSupabaseServerClient();

  // Échange code → session utilisateur
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(error.message)}`,
        requestUrl.origin
      )
    );
  }

  // 🔥 IMPORTANT : redirection intelligente
  if (next) {
    return NextResponse.redirect(
      new URL(next.startsWith("/") ? next : `/${next}`, requestUrl.origin)
    );
  }

  // fallback (par défaut)
  return NextResponse.redirect(
    new URL("/reset-password", requestUrl.origin)
  );
}
