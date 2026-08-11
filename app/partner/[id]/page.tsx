"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { categories } from "@/lib/data";

export default function PartnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ✅ THE FIX: unwrap the Promise params
  const { id } = use(params);

  const router = useRouter();
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [date, setDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchPartner() {
      const { data } = await supabase
        .from("partners")
        .select("*")
        .eq("id", id)
        .single();

      setPartner(data);
      setLoading(false);
    }
    fetchPartner();
  }, [id]);

  async function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("service_requests").insert({
      partner_id: partner.id,
      user_id: user.id,
      title,
      description,
      budget: Number(budget),
      scheduled_date: date,
    });

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("✅ Request sent to partner successfully!");
      setTitle("");
      setDescription("");
      setBudget("");
      setDate("");
      setShowForm(false);
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-xl font-bold">
        Loading Profile...
      </div>
    );
  }

  if (!partner) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Partner not found</h1>
        <Link
          href="/explore"
          className="mt-4 inline-block rounded-lg bg-blue-700 px-4 py-2 text-white"
        >
          Back to Explore
        </Link>
      </main>
    );
  }

  const category = categories.find(
    (item) => item.slug === partner.category_slug
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/explore" className="text-sm text-blue-700">
        ← Back to Explore
      </Link>

      <section className="mt-4 rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">
              {category?.icon} {category?.name}
            </p>
            <h1 className="mt-2 text-4xl font-black">
              {partner.business_name}
            </h1>
            <p className="mt-2 text-slate-600">
              Owned by {partner.owner_name} • {partner.city}
            </p>
          </div>

          {partner.is_verified ? (
            <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">
              Verified Partner
            </span>
          ) : (
            <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700">
              Verification Pending
            </span>
          )}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Rating</p>
            <p className="mt-1 text-2xl font-bold">⭐ {partner.rating}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Trust Score</p>
            <p className="mt-1 text-2xl font-bold">{partner.trust_score}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Experience</p>
            <p className="mt-1 text-2xl font-bold">
              {partner.experience_years} Yrs
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Starting Price</p>
            <p className="mt-1 text-2xl font-bold">
              ₹{partner.starting_price}
            </p>
          </div>
        </div>

        <p className="mt-8 text-lg text-slate-700">
          {partner.description || "No description provided."}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
          >
            {showForm ? "Cancel Request" : "Request Service"}
          </button>
          <button className="rounded-xl border px-6 py-3 font-semibold">
            Contact Partner
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleRequestSubmit} className="mt-8 space-y-4 border-t pt-8">
            <h3 className="text-xl font-bold text-slate-800">
              Send a Service Request
            </h3>

            <div>
              <label className="text-sm font-semibold">
                What do you need? *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border px-4 py-3"
                placeholder="e.g., Need lorry for house shifting"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Details</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border px-4 py-3"
                placeholder="From where to where? Any specific requirements?"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold">
                  Your Budget (₹)
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="mt-1 w-full rounded-xl border px-4 py-3"
                  placeholder="e.g., 5000"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">
                  Required Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border px-4 py-3"
                />
              </div>
            </div>

            <button
              disabled={submitting}
              className="w-full rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Send Request to Partner"}
            </button>

            {message && (
              <p
                className={`rounded-xl p-3 text-sm ${
                  message.includes("✅")
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message}
              </p>
            )}
          </form>
        )}
      </section>
    </main>
  );
}