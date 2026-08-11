"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile(sessionUser: any) {
      setUser(sessionUser);

      if (!sessionUser) {
        setRole(null);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", sessionUser.id)
        .single();

      setRole(data?.role ?? null);
    }

    supabase.auth.getSession().then(({ data }) => {
      loadProfile(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        loadProfile(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-2xl font-black text-blue-700">
          Servio
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href="/explore"
            className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-100"
          >
            Explore
          </Link>

          {role === "partner" && (
            <Link
              href="/partner/dashboard"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Dashboard
            </Link>
          )}

          {user ? (
            <>
              <span className="hidden text-sm text-slate-500 md:block">
                {user.email}
              </span>

              <button
                onClick={logout}
                className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-100"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-100"
              >
                Login
              </Link>

              <Link
                href="/signup"
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}