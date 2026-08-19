"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Request = {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  scheduled_date: string | null;
  status: string;
  created_at: string;
  partner: {
    id: string;
    business_name: string;
    category_slug: string;
    city: string;
    phone: string | null;
  } | null;
};

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch customer's own requests + partner info
      const { data, error } = await supabase
        .from("service_requests")
        .select(
          `
          id,
          title,
          description,
          budget,
          scheduled_date,
          status,
          created_at,
          partner:partners (
            id,
            business_name,
            category_slug,
            city,
            phone
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setRequests((data as any) || []);
      }

      setLoading(false);
    }

    load();
  }, [router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <span className="w-2 h-2 rounded-full bg-amber-400 mr-2 animate-pulse"></span>
            Pending
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>
            Accepted
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(244,63,94,0.2)]">
            <span className="w-2 h-2 rounded-full bg-rose-400 mr-2"></span>
            Rejected
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 mr-2"></span>
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-500/20 text-slate-300 border border-slate-500/30 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-slate-400 mr-2"></span>
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-950 flex items-center justify-center relative overflow-hidden">
        {/* Background elements for loading screen */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/30 rounded-full blur-[120px] mix-blend-screen" />
        
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_30px_rgba(99,102,241,0.5)]" />
          <p className="text-indigo-200 font-medium tracking-wide animate-pulse">Loading your requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 relative overflow-hidden font-sans">
      {/* 3D Colorful Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[60%] bg-fuchsia-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-cyan-500/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgNDBoNDBNNDAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiLz4KPC9zdmc+')] opacity-50 pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 py-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-400 drop-shadow-sm">
              My Requests
            </h1>
            <p className="text-slate-400 text-lg font-medium">
              Track and manage all your service bookings in one place.
            </p>
          </div>
          <Link
            href="/explore"
            className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-bold text-white transition-all duration-200 bg-indigo-600 font-pj rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 hover:bg-indigo-500 hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(99,102,241,0.5)] active:translate-y-0"
          >
            <span className="mr-2 text-xl leading-none">+</span> New Request
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-16 text-center shadow-2xl">
              <div className="w-24 h-24 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-700 shadow-inner">
                <span className="text-4xl">🚀</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No requests yet</h3>
              <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                Ready to get started? Browse our verified partners and book your first service today.
              </p>
              <Link
                href="/explore"
                className="inline-flex px-8 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                Browse Partners
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {requests.map((req) => (
              <div
                key={req.id}
                className="group relative bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 hover:bg-slate-800/60 hover:border-indigo-500/30 hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.3)]"
                style={{
                  transformStyle: "preserve-3d",
                  perspective: "1000px"
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-fuchsia-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <h2 className="text-2xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {req.title}
                      </h2>
                      {getStatusBadge(req.status)}
                    </div>

                    <p className="text-slate-300 leading-relaxed max-w-3xl">
                      {req.description}
                    </p>

                    <div className="pt-4 mt-4 border-t border-slate-700/50 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {req.partner && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Partner</p>
                          <Link
                            href={`/partner/${req.partner.id}`}
                            className="inline-flex items-center text-indigo-400 hover:text-fuchsia-400 font-medium transition-colors"
                          >
                            {req.partner.business_name}
                            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </Link>
                        </div>
                      )}
                      
                      {req.budget && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Budget</p>
                          <p className="text-slate-200 font-medium">₹{req.budget.toLocaleString()}</p>
                        </div>
                      )}
                      
                      {req.scheduled_date && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scheduled Date</p>
                          <p className="text-slate-200 font-medium">
                            {new Date(req.scheduled_date).toLocaleDateString(undefined, { 
                              weekday: 'short', month: 'short', day: 'numeric' 
                            })}
                          </p>
                        </div>
                      )}

                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Requested On</p>
                        <p className="text-slate-400 font-medium text-sm">
                          {new Date(req.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}