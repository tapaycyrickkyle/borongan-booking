"use client";

import { useState } from "react";

export default function ReservationActions({ id, status }) {
  const [message, setMessage] = useState("");
  async function act(action) {
    const response = await fetch(`/api/owner/reservations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    setMessage(response.ok ? "Saved" : "Action unavailable");
    if (response.ok) window.location.reload();
  }
  const actions = status === "pending" ? [["approve", "Approve"], ["decline", "Decline"]] : status === "confirmed" ? [["check_in", "Check in"], ["no_show", "No-show"]] : status === "checked_in" ? [["complete", "Mark completed"]] : status === "cancellation_requested" ? [["approve_cancellation", "Approve cancellation"], ["decline_cancellation", "Decline cancellation"]] : [];
  return <div className="flex flex-wrap gap-2">{actions.map(([action, label]) => <button key={action} onClick={() => act(action)} className="border border-stone-900 px-3 py-2 text-xs font-semibold hover:bg-stone-900 hover:text-white">{label}</button>)}{message && <span className="self-center text-xs text-stone-600">{message}</span>}</div>;
}
