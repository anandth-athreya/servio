import Link from "next/link";
import { categories } from "@/lib/data";

export default function Home() {
  const serviceCategories = categories.filter(
    (category) => category.slug !== "all"
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="rounded-3xl bg-white p-8 shadow-sm md:p-14">
        <p className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
          Unified Local Service Marketplace
        </p>

        <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
          Find trusted local service partners instantly.
        </h1>

        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Discover, verify and book lorry operators, advocates, land
          brokers and local shops in one marketplace.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/explore"
            className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
          >
            Explore Services
          </Link>

          <Link
            href="/explore"
            className="rounded-xl border bg-white px-6 py-3 font-semibold hover:bg-slate-50"
          >
            View Partners
          </Link>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Categories</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {serviceCategories.map((category) => (
            <Link
              key={category.slug}
              href="/explore"
              className="rounded-2xl bg-white p-5 shadow-sm hover:shadow-md"
            >
              <div className="text-3xl">{category.icon}</div>

              <h3 className="mt-3 text-lg font-bold">
                {category.name}
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                {category.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}