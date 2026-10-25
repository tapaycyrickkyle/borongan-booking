import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedBusinessRooms } from "../../../../lib/public.js";

export const dynamic = "force-dynamic";

function formatPrice(centavos) {
  if (centavos == null) return "Price unavailable";
  return `₱${(centavos / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })} / night`;
}

export default async function BusinessRoomsPage({ params }) {
  const { id } = await params;
  const data = await getPublishedBusinessRooms(id);
  if (!data) notFound();

  const business = data.business;
  const rooms = data.rooms;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
      <Link href="/" className="inline-flex min-h-10 items-center rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2">Back to properties</Link>
      <p className="mt-8 text-sm text-emerald-700">Rooms and units</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">{business.name}</h1>
      {business.description && <p className="mt-3 max-w-2xl text-stone-600">{business.description}</p>}

      {rooms.length ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => {
            const imageKey = room.unit_image_key ?? room.property_image_key;
            return (
              <article key={`${room.property_id ?? room.property_slug}-${room.unit_id}`} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
                <div className="flex aspect-[4/3] items-center justify-center bg-stone-100 text-sm text-stone-500">
                  {imageKey ? <img src={`/api/images/${imageKey}`} alt={`${room.unit_name} at ${business.name}`} className="h-full w-full object-cover" /> : "No image"}
                </div>
                <div className="p-4">
                  <h2 className="font-medium">{room.unit_name}</h2>
                  <p className="mt-1 text-sm text-stone-600">{room.property_title} · up to {room.capacity} guests</p>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{formatPrice(room.price_per_night)}</p>
                    <Link href={`/listings/${room.property_slug}?unit=${encodeURIComponent(room.unit_id)}`} className="inline-flex min-h-10 items-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2">Book</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : <div className="mt-8 border border-dashed border-stone-300 bg-white p-8 text-sm text-stone-600">No rooms are available yet.</div>}
    </main>
  );
}
