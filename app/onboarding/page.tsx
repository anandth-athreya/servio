"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const categories = [
  { slug: "lorry-transport", name: "Lorry & Transport" },
  { slug: "advocate", name: "Advocate" },
  { slug: "land-broker", name: "Land Broker" },
  { slug: "local-shops", name: "Local Shop" },
  { slug: "home-services", name: "Home Services" },
];

export default function Onboarding() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [message, setMessage] = useState("");

  // 🚀 NEW LOGIC: Check if user already completed onboarding
  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (profile?.role === "partner") router.push("/partner/dashboard");
        else if (profile?.role === "customer") router.push("/explore");
      }
    }
    checkRole();
  }, [router]);

  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [category, setCategory] = useState("lorry-transport");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [experience, setExperience] = useState("0");
  const [startingPrice, setStartingPrice] = useState("0");
  const [description, setDescription] = useState("");

  async function getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    return data.user;
  }

  async function chooseSimpleRole(role: string) {
    setSaving(true);
    const user = await getCurrentUser();
    if (!user) { router.push("/login"); return; }

    const { error } = await supabase.from("profiles").update({ role }).eq("id", user.id);
    setSaving(false);
    if (!error) router.push(role === "partner" ? "/partner/dashboard" : "/explore");
  }

  async function submitPartnerForm(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const user = await getCurrentUser();
    if (!user) { router.push("/login"); return; }

    const { error } = await supabase.from("partners").insert({
      user_id: user.id, business_name: businessName, owner_name: ownerName,
      category_slug: category, city, phone, experience_years: Number(experience),
      starting_price: Number(startingPrice), description,
    });

    if (error) { setMessage(error.message); setSaving(false); return; }

    await supabase.from("profiles").update({ role: "partner" }).eq("id", user.id);
    setSaving(false);
    router.push("/partner/dashboard");
  }

  if (showPartnerForm) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-black">Partner Details</h1>
          <p className="mt-2 text-slate-600">These details create your public partner profile.</p>
          <form onSubmit={submitPartnerForm} className="mt-8 space-y-4">
            <div><label className="text-sm font-semibold">Business Name *</label><input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required className="mt-1 w-full rounded-xl border px-4 py-3" placeholder="e.g. Ramesh Transport" /></div>
            <div><label className="text-sm font-semibold">Owner Name</label><input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="mt-1 w-full rounded-xl border px-4 py-3" /></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><label className="text-sm font-semibold">Category *</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-xl border bg-white px-4 py-3">{categories.map((c) => (<option key={c.slug} value={c.slug}>{c.name}</option>))}</select></div>
              <div><label className="text-sm font-semibold">City *</label><input value={city} onChange={(e) => setCity(e.target.value)} required className="mt-1 w-full rounded-xl border px-4 py-3" /></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><label className="text-sm font-semibold">Phone *</label><input value={phone} onChange={(e) => setPhone(e.target.value)} required className="mt-1 w-full rounded-xl border px-4 py-3" /></div>
              <div><label className="text-sm font-semibold">Experience (Yrs)</label><input type="number" value={experience} onChange={(e) => setExperience(e.target.value)} className="mt-1 w-full rounded-xl border px-4 py-3" /></div>
            </div>
            <div><label className="text-sm font-semibold">Starting Price (₹)</label><input type="number" value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)} className="mt-1 w-full rounded-xl border px-4 py-3" /></div>
            <div><label className="text-sm font-semibold">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border px-4 py-3" /></div>
            <button disabled={saving} className="w-full rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Create Partner Profile"}</button>
            {message && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-center text-3xl font-black">How will you use Servio?</h1>
      <p className="mt-2 text-center text-slate-600">Choose your role.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <button onClick={() => chooseSimpleRole("customer")} className="rounded-3xl bg-white p-6 text-left shadow-sm hover:shadow-md">
          <div className="text-3xl">🙋</div><h2 className="mt-3 text-xl font-bold">Customer</h2><p className="mt-2 text-sm text-slate-600">Find and book services.</p>
        </button>
        <button onClick={() => setShowPartnerForm(true)} className="rounded-3xl bg-white p-6 text-left shadow-sm hover:shadow-md">
          <div className="text-3xl">🛠️</div><h2 className="mt-3 text-xl font-bold">Service Partner</h2><p className="mt-2 text-sm text-slate-600">Grow your business.</p>
        </button>
        <button onClick={() => chooseSimpleRole("admin")} className="rounded-3xl bg-white p-6 text-left shadow-sm hover:shadow-md">
          <div className="text-3xl">🛡️</div><h2 className="mt-3 text-xl font-bold">Admin</h2><p className="mt-2 text-sm text-slate-600">Manage platform.</p>
        </button>
      </div>
    </main>
  );
}