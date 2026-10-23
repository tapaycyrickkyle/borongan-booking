"use client";

import { useState } from "react";

export default function GuestReservationView({ reference, token }) {
  const [state, setState] = useState({ status: "idle", reservation: null, message: "" });
  async function load() {
    setState({ status: "pending", reservation: null, message: "" });
    const response = await fetch(`/api/reservations/${encodeURIComponent(reference)}?token=${encodeURIComponent(token)}`);
    const body = await response.json();
    setState(response.ok ? { status: "ready", reservation: body.reservation, message: "" } : { status: "error", reservation: null, message: "This private link is invalid or expired." });
  }
  async function requestCancellation() {
    const response = await fetch(`/api/reservations/${encodeURIComponent(reference)}/cancellation`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    const body = await response.json();
    if (response.ok) setState((current) => ({ ...current, reservation: { ...current.reservation, status: body.status }, message: "Cancellation request sent to the owner." }));
    else setState((current) => ({ ...current, message: "Cancellation could not be requested." }));
  }
  return (
    <div className="border border-stone-200 bg-white p-5 sm:p-6">
      <button onClick={load} disabled={state.status === "pending"} className="min-h-10 bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-60">{state.status === "pending" ? "Loading…" : "View reservation"}</button>
      {state.message && <p role="status" className="mt-4 text-sm text-stone-700">{state.message}</p>}
      {state.reservation && <div className="mt-5 border-t border-stone-200 pt-5 text-sm"><p className="text-xs uppercase tracking-[0.14em] text-stone-500">Status</p><p className="mt-1 text-lg font-semibold">{state.reservation.status.replaceAll("_", " ")}</p><p className="mt-4">{state.reservation.property_title} · {state.reservation.unit_name}</p><p className="mt-1 text-stone-600">{state.reservation.check_in} to {state.reservation.check_out}</p>{["pending", "confirmed", "checked_in"].includes(state.reservation.status) && <button onClick={requestCancellation} className="mt-5 border border-red-700 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Request cancellation</button>}</div>}
    </div>
  );
}
