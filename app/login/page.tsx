"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    // 🚀 NEW LOGIC: Check the user's role in the database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "partner") {
        router.push("/partner/dashboard"); // Send partner to dashboard
      } else if (profile?.role === "customer") {
        router.push("/explore"); // Send customer to explore
      } else {
        router.push("/onboarding"); // Send new users to onboarding
      }
    }

    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black">Login to Servio</h1>
        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-semibold">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm font-semibold">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button disabled={loading} className="w-full rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
            {loading ? "Logging in..." : "Login"}
          </button>
          {message && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
        </form>
        <p className="mt-6 text-sm text-slate-600">
          New to Servio? <a href="/signup" className="font-semibold text-blue-700">Create account</a>
        </p>
      </div>
    </main>
  );
}