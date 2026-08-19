"use client";

import Link from "next/link";
import { categories } from "@/lib/data";
import { motion } from "framer-motion";
import { MapPin, Search, Star, Clock, CreditCard, ChevronRight } from "lucide-react";

export default function Home() {
  const serviceCategories = categories.filter(
    (category) => category.slug !== "all"
  );

  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-950 font-sans pb-20">
      {/* 3D Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/30 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[60%] bg-fuchsia-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-cyan-500/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgNDBoNDBNNDAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiLz4KPC9zdmc+')] pointer-events-none"></div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-8">
        
        {/* Search & Location Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-dark rounded-2xl p-2 mb-12 flex flex-col md:flex-row gap-2 max-w-3xl mx-auto"
        >
          <div className="flex items-center bg-slate-800/50 rounded-xl px-4 py-3 flex-1 border border-slate-700/50">
            <MapPin className="text-fuchsia-400 w-5 h-5 mr-3" />
            <input 
              type="text" 
              placeholder="Current Location" 
              className="bg-transparent border-none outline-none text-slate-200 w-full placeholder-slate-500"
              defaultValue="New Delhi, India"
            />
          </div>
          <div className="flex items-center bg-slate-800/50 rounded-xl px-4 py-3 flex-[2] border border-slate-700/50">
            <Search className="text-cyan-400 w-5 h-5 mr-3" />
            <input 
              type="text" 
              placeholder="Search services or partners..." 
              className="bg-transparent border-none outline-none text-slate-200 w-full placeholder-slate-500"
            />
            <Link href="/explore" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg p-2 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            Premium Service Marketplace
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
            Services that <br/>
            <span className="text-gradient">redefine local.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
            Experience the future of local services. Verified partners, transparent pricing, and instant bookings for everything you need.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/explore" className="btn-primary">
              Explore Services
            </Link>
            <Link href="/explore" className="btn-secondary !bg-slate-800 !text-white !border-slate-700 hover:!bg-slate-700">
              View Recommended
            </Link>
          </div>
        </motion.section>

        {/* 3D Categories Grid */}
        <section className="mb-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Categories</h2>
              <p className="text-slate-400">Find exactly what you're looking for</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {serviceCategories.map((category, idx) => (
              <motion.div
                key={category.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link
                  href="/explore"
                  className="card-3d block relative h-48 rounded-3xl overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-3xl z-0 group-hover:border-indigo-500/50 transition-colors" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent z-10" />
                  
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-500 z-0 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    {category.icon}
                  </div>

                  <div className="relative z-20 h-full p-5 flex flex-col justify-end">
                    <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-xl mb-3 group-hover:-translate-y-1 transition-transform">
                      {category.icon}
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-1">
                      {category.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Quick Actions / Highlights */}
        <div className="grid md:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-dark rounded-3xl p-6 border border-fuchsia-500/20"
          >
            <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center mb-4">
              <Star className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Top Rated</h3>
            <p className="text-slate-400 text-sm mb-4">Book partners with verified 5-star reviews from your community.</p>
            <Link href="/explore" className="text-fuchsia-400 text-sm font-bold hover:text-fuchsia-300 flex items-center">
              View Partners <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-dark rounded-3xl p-6 border border-cyan-500/20"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Instant Booking</h3>
            <p className="text-slate-400 text-sm mb-4">No more waiting. Get confirmation from local partners within minutes.</p>
            <Link href="/explore" className="text-cyan-400 text-sm font-bold hover:text-cyan-300 flex items-center">
              Book Now <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-dark rounded-3xl p-6 border border-indigo-500/20"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Secure Payments</h3>
            <p className="text-slate-400 text-sm mb-4">Pay safely via UPI, Cards, NetBanking, Wallet, or direct Cash.</p>
            <span className="text-indigo-400 text-sm font-bold flex items-center">
              100% Protected <ChevronRight className="w-4 h-4 ml-1" />
            </span>
          </motion.div>
        </div>

      </div>
    </main>
  );
}