"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function PartnerDashboard() {
  const router = useRouter();
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPartner() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch the partner details from the partners table
      const { data } = await supabase
        .from("partners")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setPartner(data);
      } else {
        router.push("/onboarding");
      }
      setLoading(false);
    }
    loadPartner();
  }, [router]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-xl font-bold">Loading Dashboard...</div>;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-black">Welcome back, {partner?.owner_name || partner?.business_name}! 👋</h1>
      <p className="mt-2 text-slate-600">Here is your partner business overview.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Verification Status</p>
          <p className={`mt-1 text-2xl font-black ${partner?.is_verified ? 'text-emerald-600' : 'text-amber-600'}`}>
            {partner?.is_verified ? "Verified" : "Pending"}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Trust Score</p>
          <p className="mt-1 text-2xl font-black">{partner?.trust_score}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Starting Price</p>
          <p className="mt-1 text-2xl font-black">₹{partner?.starting_price}</p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Business Details</h2>
        <p className="mt-2 text-slate-700">{partner?.description || "No description added yet."}</p>
        <p className="mt-2 text-sm text-slate-500">Category: <span className="font-bold capitalize">{partner?.category_slug?.replace('-', ' ')}</span></p>
        <p className="text-sm text-slate-500">Location: <span className="font-bold">{partner?.city}</span></p>
      </div>

      <Link href="/explore" className="mt-8 inline-block rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800">
        View Marketplace
      </Link>
    </main>
  );
}