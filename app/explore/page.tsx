"use client";

import { useState } from "react";
import Link from "next/link";
import { categories, getFilteredPartners } from "../lib/data";

export default function Explore() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");

  const filteredPartners = getFilteredPartners(activeCategory, query);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <Link href="/" className="text-sm text-blue-700">
          ← Back home
        </Link>

        <h1 className="mt-2 text-3xl font-black">
          Explore Servio Partners
        </h1>

        <p className="mt-1 text-slate-600">
          Search and compare trusted local service partners.
        </p>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by partner, city or service..."
          className="w-full rounded-xl border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white">
          Search
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.slug}
            onClick={() => setActiveCategory(category.slug)}
            className={
              activeCategory === category.slug
                ? "rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
                : "rounded-full border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100"
            }
          >
            {category.icon} {category.name}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPartners.map((partner) => (
          <Link
            key={partner.id}
            href={`/partner/${partner.id}`}
            className="rounded-2xl bg-white p-5 shadow-sm hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">
                  {partner.businessName}
                </h2>

                <p className="text-sm text-slate-600">
                  {partner.city}
                </p>
              </div>

              {partner.isVerified ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  Verified
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                  Pending
                </span>
              )}
            </div>

            <p className="mt-3 line-clamp-2 text-sm text-slate-600">
              {partner.description}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Rating</p>
                <p className="font-bold">⭐ {partner.rating}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Trust Score</p>
                <p className="font-bold">{partner.trustScore}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Starts at ₹{partner.startingPrice}
              </span>

              <span className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white">
                View Profile
              </span>
            </div>
          </Link>
        ))}
      </div>

      {filteredPartners.length === 0 && (
        <div className="rounded-2xl bg-white p-10 text-center text-slate-600">
          No partners found.
        </div>
      )}
    </main>
  );
}