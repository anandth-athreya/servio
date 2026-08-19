"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { categories } from "@/lib/data";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Star, ShieldCheck, ArrowLeft, Clock, Calendar, DollarSign, Send, CheckCircle2, MessageSquare, Briefcase } from "lucide-react";

export default function PartnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
  const [hasRequested, setHasRequested] = useState(false);

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
      status: "pending"
    });

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Request sent successfully! The partner will review it shortly.");
      setHasRequested(true);
      setShowForm(false);
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[120px] mix-blend-screen" />
        <div className="w-16 h-16 border-4 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin z-10" />
      </div>
    );
  }

  if (!partner) {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl font-bold text-white mb-4">Partner not found</h1>
        <p className="text-slate-400 mb-8">The service provider you are looking for does not exist.</p>
        <Link href="/explore" className="btn-primary">
          Back to Explore
        </Link>
      </main>
    );
  }

  const category = categories.find((item) => item.slug === partner.category_slug);

  return (
    <main className="min-h-screen bg-slate-950 relative overflow-hidden font-sans pb-20 pt-8">
      {/* 3D Background Elements */}
      <div className="absolute top-[0%] left-[20%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[50%] bg-cyan-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgNDBoNDBNNDAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiLz4KPC9zdmc+')] pointer-events-none opacity-40"></div>

      <div className="relative z-10 max-w-5xl mx-auto px-4">
        <Link href="/explore" className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Partners
        </Link>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-2xl flex items-start gap-3 backdrop-blur-md border ${
              message.includes("Error") 
                ? "bg-red-500/10 border-red-500/30 text-red-400" 
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            }`}
          >
            {message.includes("Error") ? <Star className="w-6 h-6 shrink-0" /> : <CheckCircle2 className="w-6 h-6 shrink-0" />}
            <p className="font-medium">{message}</p>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          
          {/* Main Profile Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="glass-dark rounded-3xl p-8 border border-slate-700/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <Briefcase className="w-48 h-48 text-indigo-500" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 text-sm font-bold border border-indigo-500/30">
                    {category?.icon} {category?.name}
                  </span>
                  {partner.is_verified ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm font-bold border border-emerald-500/30">
                      <ShieldCheck className="w-4 h-4" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 text-sm font-bold border border-amber-500/30">
                      Pending
                    </span>
                  )}
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-white mb-2">{partner.business_name}</h1>
                <p className="text-xl text-slate-300 mb-6 flex items-center gap-2">
                  <MapPin className="text-indigo-400" /> {partner.city} <span className="text-slate-600">•</span> <span>By {partner.owner_name}</span>
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-700/50">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Rating</p>
                    <p className="text-2xl font-bold text-white flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> {partner.rating}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Trust Score</p>
                    <p className="text-2xl font-bold text-white text-gradient">{partner.trust_score}/100</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Experience</p>
                    <p className="text-2xl font-bold text-white">{partner.experience_years} Yrs</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Starts at</p>
                    <p className="text-2xl font-bold text-emerald-400">₹{partner.starting_price}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-dark rounded-3xl p-8 border border-slate-700/50">
              <h2 className="text-2xl font-bold text-white mb-4">About the Business</h2>
              <p className="text-slate-300 leading-relaxed text-lg">
                {partner.description || "This partner has not provided a detailed description yet."}
              </p>
            </div>
          </motion.div>

          {/* Booking / Action Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="glass-dark rounded-3xl p-6 md:p-8 border border-indigo-500/30 shadow-2xl shadow-indigo-900/20 sticky top-24">
              
              {!showForm && !hasRequested && (
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white mb-6">Ready to hire?</h3>
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full btn-primary text-lg shadow-indigo-500/30"
                  >
                    Request Service Now
                  </button>
                  <button className="w-full btn-secondary !bg-slate-800 !text-white !border-slate-700 hover:!bg-slate-700 flex items-center justify-center gap-2">
                    <MessageSquare className="w-5 h-5" /> Contact Partner
                  </button>
                </div>
              )}

              {hasRequested && (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Request Sent</h3>
                  <p className="text-slate-400 mb-6">Your request has been forwarded. The partner will contact you soon.</p>
                  <Link href="/my-requests" className="w-full btn-secondary !bg-slate-800 !text-white !border-slate-700 hover:!bg-slate-700 block">
                    Track Status
                  </Link>
                </div>
              )}

              <AnimatePresence>
                {showForm && !hasRequested && (
                  <motion.form 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleRequestSubmit} 
                    className="space-y-5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">Service Details</h3>
                      <button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-400 hover:text-white">Cancel</button>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5">What do you need? *</label>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="e.g., House shifting service"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5">Additional Details</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"
                        placeholder="Specific requirements, addresses, etc."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                          <DollarSign className="w-4 h-4" /> Budget (₹)
                        </label>
                        <input
                          type="number"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                          placeholder="5000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                          <Calendar className="w-4 h-4" /> Date
                        </label>
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all [color-scheme:dark]"
                        />
                      </div>
                    </div>

                    <button
                      disabled={submitting}
                      className="w-full btn-primary mt-2 group"
                    >
                      {submitting ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span className="flex items-center gap-2">
                          Send Request <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}