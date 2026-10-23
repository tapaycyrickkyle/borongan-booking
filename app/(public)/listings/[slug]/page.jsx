import { notFound } from "next/navigation";
import ReservationForm from "../../../../components/public/reservation-form.jsx";
import { getPublishedProperty, getUnitPrice } from "../../../../lib/public.js";

export const dynamic = "force-dynamic";

export default async function ListingPage({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const data = await getPublishedProperty(slug);
  if (!data) notFound();
  const unit = data.units[0];
  const price = unit && query.checkIn && query.checkOut ? await getUnitPrice(unit.id, query.checkIn, query.checkOut) : null;
  return <main className="mx-auto max-w-6xl px-5 py-10 lg:px-8"><div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]"><section><p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700">{data.property.property_type.replaceAll("_", " ")}</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">{data.property.title}</h1><p className="mt-3 text-stone-600">{data.property.location_text} · hosted by {data.property.business_name}</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{data.images.length ? data.images.slice(0, 4).map((image) => <div key={image.id} className="flex min-h-40 items-end border border-stone-200 bg-stone-100 p-4 text-sm text-stone-500">Photo: {image.alt_text}</div>) : <div className="min-h-40 border border-dashed border-stone-300 p-5 text-sm text-stone-500">Photos will appear here when the listing is published.</div>}</div><p className="mt-8 text-base leading-7 text-stone-700">{data.property.description}</p><dl className="mt-8 grid gap-4 border-y border-stone-200 py-6 sm:grid-cols-2"><div><dt className="text-sm text-stone-500">Capacity</dt><dd className="mt-1 font-medium">Up to {data.property.capacity} guests</dd></div><div><dt className="text-sm text-stone-500">House rules</dt><dd className="mt-1 font-medium">{data.property.house_rules}</dd></div><div><dt className="text-sm text-stone-500">Cancellation policy</dt><dd className="mt-1 font-medium">{data.property.cancellation_policy}</dd></div></dl></section><aside>{unit ? <><div className="mb-5 border border-stone-200 bg-white p-5"><p className="font-semibold">{unit.name}</p><p className="mt-1 text-sm text-stone-600">{unit.rental_mode.replace("_", " ")} · up to {unit.capacity} guests</p>{price && <p className="mt-4 text-lg font-semibold">₱{(price.totalCentavos / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })} total</p>}{!price && <p className="mt-4 text-sm text-stone-600">Enter dates to see the current total. Rates are confirmed by the owner.</p>}</div><ReservationForm property={data.property} unit={unit} checkIn={query.checkIn} checkOut={query.checkOut} /></> : <div className="border border-stone-200 bg-white p-5 text-sm">No rentable unit is available.</div>}</aside></div></main>;
}
