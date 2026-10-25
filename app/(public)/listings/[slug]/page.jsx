import Link from "next/link";
import { notFound } from "next/navigation";
import ReservationForm from "../../../../components/public/reservation-form.jsx";
import { getPublishedProperty, getUnitPrice } from "../../../../lib/public.js";

export const dynamic = "force-dynamic";

function money(centavos) {
  return `₱${(centavos / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })} total`;
}

export default async function ListingPage({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const data = await getPublishedProperty(slug);
  if (!data) notFound();

  const selectedUnit = data.units.find((unit) => unit.id === query.unit) ?? data.units[0];
  const price = selectedUnit && query.checkIn && query.checkOut
    ? await getUnitPrice(selectedUnit.id, query.checkIn, query.checkOut)
    : null;
  const unitHref = (unitId) => {
    const nextQuery = new URLSearchParams({ unit: unitId });
    if (query.checkIn) nextQuery.set("checkIn", query.checkIn);
    if (query.checkOut) nextQuery.set("checkOut", query.checkOut);
    return `/listings/${data.property.slug}?${nextQuery.toString()}`;
  };

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <p className="text-sm text-emerald-700">{data.property.property_type.replaceAll("_", " ")}</p>
          <h1 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">{data.property.title}</h1>
          <p className="mt-3 text-stone-600">{data.property.location_text} / hosted by {data.property.business_name}</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {data.images.length ? data.images.slice(0, 4).map((image) => (
              <div key={image.id} className="min-h-40 border border-stone-200 bg-stone-100">
                <img src={`/api/images/${image.object_key}`} alt={image.alt_text} className="h-40 w-full object-cover" />
              </div>
            )) : <div className="min-h-40 border border-dashed border-stone-300 p-5 text-sm text-stone-500">Photos will appear here when the listing is published.</div>}
          </div>

          <p className="mt-8 text-base leading-7 text-stone-700">{data.property.description}</p>
          <dl className="mt-8 grid gap-4 border-y border-stone-200 py-6 sm:grid-cols-2">
            <div><dt className="text-sm text-stone-500">Capacity</dt><dd className="mt-1 font-medium">Up to {data.property.capacity} guests</dd></div>
            <div><dt className="text-sm text-stone-500">House rules</dt><dd className="mt-1 font-medium">{data.property.house_rules}</dd></div>
            <div><dt className="text-sm text-stone-500">Cancellation policy</dt><dd className="mt-1 font-medium">{data.property.cancellation_policy}</dd></div>
          </dl>
        </section>

        <aside>
          <div className="border border-stone-200 bg-white p-5">
            <h2 className="text-xl font-medium">Rooms and units</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">Choose a room or unit to continue with a reservation request.</p>
            <div className="mt-5 space-y-3">
              {data.units.map((unit) => (
                <Link key={unit.id} href={unitHref(unit.id)} className={`block border p-4 focus:outline-none focus:ring-2 focus:ring-emerald-700 ${selectedUnit?.id === unit.id ? "border-emerald-700 bg-emerald-50" : "border-stone-200 hover:border-stone-400"}`}>
                  <span className="block font-medium">{unit.name}</span>
                  <span className="mt-1 block text-sm text-stone-600">{unit.rental_mode.replace("_", " ")} / up to {unit.capacity} guests</span>
                </Link>
              ))}
            </div>
          </div>

          {selectedUnit ? (
            <div className="mt-5">
              {price ? <p className="mb-4 text-sm text-stone-600">Current estimate: <span className="font-medium text-stone-900">{money(price.totalCentavos)}</span></p> : <p className="mb-4 text-sm text-stone-600">Enter dates to see the current total. Rates are confirmed by the owner.</p>}
              <ReservationForm property={data.property} unit={selectedUnit} checkIn={query.checkIn} checkOut={query.checkOut} />
            </div>
          ) : <div className="mt-5 border border-stone-200 bg-white p-5 text-sm">No rentable unit is available.</div>}
        </aside>
      </div>
    </main>
  );
}
