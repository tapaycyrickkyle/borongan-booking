"use client";

import { useState } from "react";

export default function PropertyForm() {
  const [message, setMessage] = useState("");
  const [createdId, setCreatedId] = useState("");
  async function submit(event) {
    event.preventDefault();
    const response = await fetch("/api/owner/properties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
    const body = await response.json();
    setMessage(response.ok ? `Draft created: ${body.slug}` : "Could not create the draft.");
    if (response.ok) {
      setCreatedId(body.id);
      event.currentTarget.reset();
    }
  }
  return <form onSubmit={submit} className="border border-stone-200 bg-white p-6"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Title<input required name="title" className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label><label className="text-sm font-medium">Capacity<input required type="number" min="1" max="50" name="capacity" defaultValue="2" className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label><label className="text-sm font-medium">Property type<select name="propertyType" className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal"><option value="transient_house">Transient house</option><option value="apartment">Apartment</option><option value="room">Room</option></select></label><label className="text-sm font-medium">Rental mode<select name="rentalMode" className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal"><option value="room">Individual room</option><option value="entire_property">Entire property</option></select></label><label className="text-sm font-medium sm:col-span-2">Location<input required name="locationText" className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label><label className="text-sm font-medium sm:col-span-2">Description<textarea required name="description" rows="4" className="mt-2 w-full border border-stone-300 px-3 py-2 font-normal" /></label><label className="text-sm font-medium">House rules<textarea required name="houseRules" rows="3" className="mt-2 w-full border border-stone-300 px-3 py-2 font-normal" /></label><label className="text-sm font-medium">Cancellation policy<textarea required name="cancellationPolicy" rows="3" className="mt-2 w-full border border-stone-300 px-3 py-2 font-normal" /></label></div><div className="mt-6 flex flex-wrap items-center gap-4"><button className="min-h-11 bg-emerald-700 px-5 text-sm font-semibold text-white" type="submit">Save draft</button>{message && <p role="status" className="text-sm text-stone-700">{message}</p>}{createdId && <a href={`/owner/properties/${createdId}`} className="text-sm font-semibold text-emerald-800 underline">Open property manager</a>}</div></form>;
}
