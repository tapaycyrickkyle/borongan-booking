"use client";

import { useState } from "react";

export default function ReservationForm({ property, unit, checkIn = "", checkOut = "" }) {
  const [state, setState] = useState({ status: "idle", message: "", result: null });
  async function submit(event) {
    event.preventDefault();
    setState({ status: "pending", message: "", result: null });
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/reservations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, propertyId: property.id, unitId: unit.id, propertyType: property.property_type, rentalMode: unit.rental_mode }) });
    const body = await response.json();
    if (!response.ok) return setState({ status: "error", message: body.error === "dates_unavailable" ? "Those dates are no longer available." : "Please check your details and try again.", result: null });
    event.currentTarget.reset();
    setState({ status: "success", message: "Request sent. Save this private link.", result: body });
  }
  return (
    <form onSubmit={submit} className="border border-stone-200 bg-white p-5 sm:p-6">
      <h2 className="text-xl font-medium">Request this stay</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">No payment is taken. The owner must approve your request before it is confirmed.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Full name<input required name="guestName" autoComplete="name" className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>
        <label className="text-sm font-medium">Email<input required type="email" name="email" autoComplete="email" className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>
        <label className="text-sm font-medium">Phone<input required name="phone" autoComplete="tel" className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>
        <label className="text-sm font-medium">Guests<input required type="number" min="1" max={unit.capacity} name="guestCount" defaultValue="1" className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>
        <label className="text-sm font-medium">Check-in<input required type="date" name="checkIn" defaultValue={checkIn} className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>
        <label className="text-sm font-medium">Check-out<input required type="date" name="checkOut" defaultValue={checkOut} className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>
      </div>
      <button disabled={state.status === "pending"} className="mt-6 min-h-11 bg-emerald-700 px-5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60" type="submit">{state.status === "pending" ? "Sending request…" : "Send reservation request"}</button>
      {state.message && <p role="status" className={`mt-4 text-sm ${state.status === "error" ? "text-red-700" : "text-stone-700"}`}>{state.message}</p>}
      {state.result && <p className="mt-3 break-all text-sm"><span className="font-medium">Reference:</span> {state.result.reference}<br /><a className="text-emerald-800 underline" href={state.result.accessUrl}>Open private reservation link</a></p>}
    </form>
  );
}
