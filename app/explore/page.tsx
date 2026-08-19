"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { categories } from "@/lib/data";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Star, ShieldCheck, Filter, ArrowRight } from "lucide-react";

export default function Explore() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function fetchPartners() {
      const { data, error } = await supabase.from("partners").select("*");
      if (data) setPartners(data);
      setLoading(false);
    }
    fetchPartners();
  }, []);

  const filteredPartners = partners.filter((p) => {
    const matchCat = activeCategory === "all" || p.category_slug === activeCategory;
    const q = query.toLowerCase();
    const matchQuery = 
      p.business_name?.toLowerCase().includes(q) || 
      p.city?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q);
    return matchCat && matchQuery;
  });

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-[120px] mix-blend-screen" />
        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin z-10" />
        <p className="mt-4 text-indigo-300 font-medium z-10 animate-pulse">Loading Partners...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 relative overflow-hidden font-sans pb-20">
      {/* 3D Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[60%] bg-cyan-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgNDBoNDBNNDAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiLz4KPC9zdmc+')] pointer-events-none opacity-50"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link href="/" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 text-sm font-semibold mb-4 transition-colors">
              <ArrowRight className="w-4 h-4 mr-1 rotate-180" /> Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2">Explore Partners</h1>
            <p className="text-slate-400 text-lg max-w-2xl">Discover verified professionals for your every need. Browse, compare, and book instantly.</p>
          </motion.div>
        </div>

        {/* Search & Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-dark rounded-3xl p-4 md:p-6 mb-10"
        >
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by partner name, city, or keyword..."
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div className="md:w-64 relative hidden md:block">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                placeholder="Any Location"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex items-center gap-2 text-slate-400 pr-2 border-r border-slate-700/50 shrink-0">
              <Filter className="w-4 h-4" /> <span className="text-sm font-semibold">Filter:</span>
            </div>
            {categories.map((category) => (
              <button
                key={category.slug}
                onClick={() => setActiveCategory(category.slug)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeCategory === category.slug
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:bg-slate-700"
                }`}
              >
                <span>{category.icon}</span> {category.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Results Grid */}
        {filteredPartners.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-dark rounded-3xl p-16 text-center border-dashed border-2 border-slate-700/50"
          >
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No partners found</h3>
            <p className="text-slate-400">Try adjusting your search or selecting a different category.</p>
          </motion.div>
        ) : (
          <motion.div layout className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredPartners.map((partner, idx) => (
                <motion.div
                  key={partner.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                >
                  <Link
                    href={`/partner/${partner.id}`}
                    className="card-3d block relative bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-3xl overflow-hidden group h-full flex flex-col"
                  >
                    {/* Glowing effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-fuchsia-500/0 group-hover:from-indigo-500/10 group-hover:to-fuchsia-500/10 transition-colors duration-500" />
                    
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] shrink-0">
                          <div className="w-full h-full bg-slate-900 rounded-2xl flex items-center justify-center text-xl font-bold text-white">
                            {partner.business_name.charAt(0)}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                            {partner.business_name}
                          </h2>
                          <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" /> {partner.city}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        {partner.is_verified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                            Pending
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                          {categories.find(c => c.slug === partner.category_slug)?.icon} {categories.find(c => c.slug === partner.category_slug)?.name}
                        </span>
                      </div>

                      <p className="text-sm text-slate-400 line-clamp-2 mb-6 flex-1">
                        {partner.description || "Premium service provider offering quality solutions for your specific needs."}
                      </p>

                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800">
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Rating</p>
                          <p className="text-sm font-bold text-white flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /> {partner.rating || "4.8"}
                          </p>
                        </div>
                        <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800">
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Trust Score</p>
                          <p className="text-sm font-bold text-white">{partner.trust_score || "95"}/100</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Starting at</p>
                          <p className="text-lg font-black text-white">₹{partner.starting_price}</p>
                        </div>
                        <span className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                          <ArrowRight className="w-5 h-5 group-hover:-rotate-45 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </main>
  );
}