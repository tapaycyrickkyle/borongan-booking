"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function SearchForm({ values = {} }) {
  const [query, setQuery] = useState(String(values.q || ""));
  const pathname = usePathname();
  const router = useRouter();

  function submit(event) {
    const formData = new FormData(event.currentTarget);
    const hasFilter = ["q", "minPrice", "maxPrice"].some((name) => String(formData.get(name) || "").trim());
    if (!hasFilter) {
      event.preventDefault();
      if (pathname !== "/") router.push("/");
    }
  }

  function clearSearch() {
    setQuery("");
    if (pathname === "/search") router.push("/");
  }

  return (
    <form action="/search" method="get" onSubmit={submit} className="flex flex-col gap-3 rounded-lg border border-stone-200 bg-white p-4 sm:flex-row sm:items-end">
      <label className="min-w-0 flex-1 text-xs font-medium text-stone-600" htmlFor="stay-search">Search stays
        <span className="relative mt-1 block">
          <input id="stay-search" name="q" type="text" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search businesses, stays, or locations" className="min-h-11 w-full rounded-md border border-stone-300 bg-white px-3 pr-10 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-emerald-700" />
          {query && <button type="button" aria-label="Clear search" onClick={clearSearch} className="absolute inset-y-0 right-1 my-1 flex w-9 items-center justify-center rounded-md text-lg leading-none text-stone-600 hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700">×</button>}
        </span>
      </label>
      <div className="grid grid-cols-2 gap-3 sm:w-64">
        <label className="text-xs font-medium text-stone-600">Min price
          <input name="minPrice" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={values.minPrice || ""} placeholder="₱ 0" className="mt-1 min-h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-emerald-700" />
        </label>
        <label className="text-xs font-medium text-stone-600">Max price
          <input name="maxPrice" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={values.maxPrice || ""} placeholder="₱ 0" className="mt-1 min-h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-emerald-700" />
        </label>
      </div>
      <button className="min-h-11 rounded-md bg-emerald-700 px-5 text-sm font-medium text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2" type="submit">Search</button>
    </form>
  );
}
