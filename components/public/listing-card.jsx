import Link from "next/link";

function money(centavos) {
  return centavos == null ? "Rate on request" : `₱${(centavos / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })} / night`;
}

export default function ListingCard({ listing }) {
  return (
    <article className="border border-stone-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">{listing.property_type.replaceAll("_", " ")}</p>
      <h2 className="mt-2 text-xl font-semibold"><Link href={`/listings/${listing.slug}`} className="hover:underline">{listing.title}</Link></h2>
      <p className="mt-2 text-sm text-stone-600">{listing.location_text}</p>
      <div className="mt-5 flex items-end justify-between gap-4 border-t border-stone-200 pt-4 text-sm">
        <div><p className="font-medium">{listing.unit_name}</p><p className="mt-1 text-stone-600">Up to {listing.capacity} guests · {listing.rental_mode.replace("_", " ")}</p></div>
        <p className="text-right font-semibold">{money(listing.amount_centavos)}</p>
      </div>
      <Link href={`/listings/${listing.slug}`} className="mt-5 inline-flex min-h-10 items-center border border-stone-900 px-4 text-sm font-semibold hover:bg-stone-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2">View stay</Link>
    </article>
  );
}
