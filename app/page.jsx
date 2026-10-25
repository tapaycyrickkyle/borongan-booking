import Link from "next/link";
import ListingCard from "../components/public/listing-card.jsx";
import SearchForm from "../components/public/search-form.jsx";
import { groupUnitsByBusiness, searchPublishedUnits } from "../lib/public.js";
import { mockGroups } from "../lib/mock-public.js";

export const dynamic = "force-dynamic";

export default async function Home() {
  const groups = [...groupUnitsByBusiness(await searchPublishedUnits({})), ...mockGroups];
  const properties = groups.flatMap((group) => group.properties);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-950">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-3 px-5 py-4 lg:px-8">
          <Link href="/" className="text-base font-medium tracking-tight">Booking Borongan</Link>
          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm">
            <Link href="/owner/sign-in" className="border border-stone-300 px-4 py-2 font-medium hover:bg-stone-50">Owner sign in</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        <div>
          <SearchForm />
        </div>

        <div className="mt-8">
          <div className="flex items-end justify-between gap-4 border-b border-stone-200 pb-4">
            <div>
              <h2 className="text-2xl font-medium tracking-tight">Find a place to stay</h2>
              <p className="mt-1 text-sm text-stone-600">Browse local properties, then choose the room or unit that fits your plans.</p>
            </div>
            <p className="text-sm text-stone-500">{properties.length} properties</p>
          </div>

          {properties.length ? (
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {properties.map((property) => (
                <ListingCard key={property.property_id} listing={property} />
              ))}
            </div>
          ) : (
            <div className="mt-8 border border-dashed border-stone-300 bg-white p-8 text-sm text-stone-600">
              No published properties are available yet. Please check again soon.
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
