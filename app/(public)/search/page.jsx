import SearchForm from "../../../components/public/search-form.jsx";
import ListingCard from "../../../components/public/listing-card.jsx";
import { searchPublishedUnits } from "../../../lib/public.js";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const filters = { checkIn: params.checkIn, checkOut: params.checkOut, propertyType: params.propertyType, rentalMode: params.rentalMode };
  const listings = await searchPublishedUnits(filters);
  return <main className="mx-auto max-w-6xl px-5 py-10 lg:px-8"><p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700">Find a stay</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Available accommodations in Borongan</h1><p className="mt-3 max-w-2xl text-stone-600">Only approved and published listings appear here. Pending reservation requests do not block dates.</p><div className="mt-8"><SearchForm values={params} /></div><section className="mt-10"><div className="flex items-baseline justify-between gap-4"><h2 className="text-xl font-semibold">{listings.length} {listings.length === 1 ? "option" : "options"}</h2>{filters.checkIn && filters.checkOut && <p className="text-sm text-stone-600">{filters.checkIn} to {filters.checkOut}</p>}</div>{listings.length ? <div className="mt-5 grid gap-4 md:grid-cols-2">{listings.map((listing) => <ListingCard key={`${listing.property_id}-${listing.unit_id}`} listing={listing} />)}</div> : <div className="mt-5 border border-dashed border-stone-300 bg-white p-8 text-sm text-stone-600">No published stays match those filters.</div>}</section></main>;
}
