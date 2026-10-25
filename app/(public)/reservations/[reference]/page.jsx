import GuestReservationView from "../../../../components/public/guest-reservation-view.jsx";

export const dynamic = "force-dynamic";

export default async function GuestReservationPage({ params, searchParams }) {
  const { reference } = await params;
  const query = await searchParams;
  return <main className="mx-auto max-w-2xl px-5 py-12 lg:px-8"><p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700">Private reservation</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Reservation {reference}</h1><p className="mt-3 text-stone-600">Use the private link shown after submitting your reservation request to view status and request cancellation.</p>{query.token ? <div className="mt-8"><GuestReservationView reference={reference} token={query.token} /></div> : <div className="mt-8 border border-stone-200 bg-white p-5 text-sm text-stone-600">This page needs the private token from your reservation link.</div>}</main>;
}
