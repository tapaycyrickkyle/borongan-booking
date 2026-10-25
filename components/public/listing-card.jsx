import Link from "next/link";
import { getBusinessInitials } from "../../lib/public.js";

function formatPrice(centavos) {
  return `₱${(centavos / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

export default function ListingCard({ listing }) {
  const href = listing.href ?? `/businesses/${listing.business_id}`;
  const initials = getBusinessInitials(listing.business_name);
  const prices = (listing.units ?? [listing])
    .map((unit) => unit.amount_centavos ?? unit.price_per_night)
    .filter((price) => Number.isFinite(price));
  const lowestPrice = prices.length ? Math.min(...prices) : null;
  const highestPrice = prices.length ? Math.max(...prices) : null;
  const priceLabel = lowestPrice == null
    ? "Price unavailable"
    : lowestPrice === highestPrice
      ? `${formatPrice(lowestPrice)} / night`
      : `${formatPrice(lowestPrice)}–${formatPrice(highestPrice)} / night`;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-t-xl bg-stone-100 text-sm text-stone-500">
        No image
        <div role="img" className="absolute bottom-3 left-3 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white text-xs font-semibold text-stone-900 shadow-sm" aria-label={`${listing.business_name} logo`}>
          {listing.business_logo_key ? <img src={`/api/images/${listing.business_logo_key}`} alt={`${listing.business_name} logo`} className="h-full w-full object-contain" /> : initials}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="break-words font-medium">{listing.business_name}</p>
        <p className="mt-1 line-clamp-2 text-sm text-stone-600">{listing.short_description ?? listing.description ?? "Comfortable accommodations in Borongan City."}</p>
        <div className="mt-auto grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 pt-3">
          <p className="min-w-0 text-sm font-medium leading-5 text-stone-700">{priceLabel}</p>
          <Link href={href} className="inline-flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2">View rooms</Link>
        </div>
      </div>
    </article>
  );
}
