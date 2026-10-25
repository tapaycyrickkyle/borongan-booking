"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function moneyInput(centavos) {
  return centavos == null ? "" : (Number(centavos) / 100).toFixed(2);
}

export default function PropertyManager({ property, units, rates, blocks }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function request(path, method, body) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(path, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "request_failed");
      setMessage("Saved.");
      router.refresh();
      return true;
    } catch (error) {
      setMessage(error.message === "incomplete_property" ? "Add at least one active room and nightly rate before submitting." : "Could not save that change.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function submitForm(event, path, method = "POST") {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    await request(path, method, body);
  }

  async function archive(path, text, redirectTo = null) {
    if (!window.confirm(text)) return;
    const saved = await request(path, "DELETE");
    if (saved && redirectTo) router.push(redirectTo);
  }

  return (
    <div className="mt-8 space-y-6">
      <section className="border border-stone-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Property details</h2>
            <p className="mt-1 text-sm text-stone-600">Update the public information shown to guests.</p>
          </div>
          <span className="text-sm capitalize text-stone-600">{property.publication_status.replaceAll("_", " ")}</span>
        </div>
        <form onSubmit={(event) => submitForm(event, `/api/owner/properties/${property.id}`, "PATCH")} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Title<input required name="title" defaultValue={property.title} className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>
          <label className="text-sm font-medium">Capacity<input required name="capacity" type="number" min="1" max="50" defaultValue={property.capacity} className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>
          <label className="text-sm font-medium sm:col-span-2">Location<input required name="locationText" defaultValue={property.location_text} className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>
          <label className="text-sm font-medium sm:col-span-2">Description<textarea required name="description" rows="3" defaultValue={property.description} className="mt-2 w-full border border-stone-300 px-3 py-2 font-normal" /></label>
          <label className="text-sm font-medium">House rules<textarea required name="houseRules" rows="3" defaultValue={property.house_rules} className="mt-2 w-full border border-stone-300 px-3 py-2 font-normal" /></label>
          <label className="text-sm font-medium">Cancellation policy<textarea required name="cancellationPolicy" rows="3" defaultValue={property.cancellation_policy} className="mt-2 w-full border border-stone-300 px-3 py-2 font-normal" /></label>
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button disabled={busy} className="min-h-10 bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-60" type="submit">Save details</button>
            {property.publication_status !== "published" && <button disabled={busy} onClick={() => request(`/api/owner/properties/${property.id}`, "PATCH", { action: "submit" })} className="min-h-10 border border-stone-900 px-4 text-sm font-semibold disabled:opacity-60" type="button">Submit for review</button>}
            <button disabled={busy} onClick={() => archive(`/api/owner/properties/${property.id}`, "Archive this property? It will no longer appear publicly.", "/owner/properties")} className="min-h-10 border border-red-700 px-4 text-sm font-semibold text-red-700 disabled:opacity-60" type="button">Archive property</button>
          </div>
        </form>
      </section>

      <section className="border border-stone-200 bg-white p-6">
        <h2 className="text-xl font-semibold">Rooms and units</h2>
        <form onSubmit={(event) => submitForm(event, "/api/owner/units")} className="mt-5 grid gap-3 border-b border-stone-200 pb-5 sm:grid-cols-[1fr_9rem_12rem_auto] sm:items-end">
          <input type="hidden" name="propertyId" value={property.id} />
          <label className="text-sm font-medium">Room name<input required name="name" placeholder="Room 1" className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>
          <label className="text-sm font-medium">Capacity<input required name="capacity" type="number" min="1" max="50" defaultValue="2" className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>
          <label className="text-sm font-medium">Rental mode<select name="rentalMode" className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal"><option value="room">Individual room</option><option value="entire_property">Entire property</option></select></label>
          <button disabled={busy} className="min-h-10 bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-60" type="submit">Add room</button>
        </form>
        <div className="mt-5 space-y-3">
          {units.map((unit) => (
            <form key={unit.id} onSubmit={(event) => submitForm(event, `/api/owner/units/${unit.id}`, "PATCH")} className="grid gap-3 border border-stone-200 p-4 sm:grid-cols-[1fr_8rem_12rem_auto_auto] sm:items-end">
              <label className="text-sm font-medium">Room name<input required name="name" defaultValue={unit.name} className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>
              <label className="text-sm font-medium">Capacity<input required name="capacity" type="number" min="1" max="50" defaultValue={unit.capacity} className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>
              <label className="text-sm font-medium">Rental mode<select name="rentalMode" defaultValue={unit.rental_mode} className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal"><option value="room">Individual room</option><option value="entire_property">Entire property</option></select></label>
              <button disabled={busy} className="min-h-10 border border-stone-900 px-3 text-sm font-semibold disabled:opacity-60" type="submit">Save</button>
              <button disabled={busy} onClick={() => archive(`/api/owner/units/${unit.id}`, "Archive this room? Existing reservations will remain preserved.")} className="min-h-10 border border-red-700 px-3 text-sm font-semibold text-red-700 disabled:opacity-60" type="button">Archive</button>
            </form>
          ))}
          {!units.length && <p className="text-sm text-stone-600">No active rooms yet.</p>}
        </div>
      </section>

      <section className="border border-stone-200 bg-white p-6">
        <h2 className="text-xl font-semibold">Nightly rates</h2>
        <form onSubmit={(event) => submitForm(event, "/api/owner/rates")} className="mt-5 grid gap-3 border-b border-stone-200 pb-5 sm:grid-cols-[1fr_1fr_9rem_8rem_auto] sm:items-end">
          <label className="text-sm font-medium">Room<select required name="unitId" className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal"><option value="">Choose room</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
          <label className="text-sm font-medium">Starts<input required name="startsOn" type="date" className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>
          <label className="text-sm font-medium">Ends<input required name="endsOn" type="date" className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>
          <label className="text-sm font-medium">PHP / night<input required name="amountPesos" type="number" min="0" step="0.01" className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>
          <button disabled={busy} className="min-h-10 bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-60" type="submit">Add rate</button>
        </form>
        <div className="mt-5 space-y-3">
          {rates.map((rate) => (
            <form key={rate.id} onSubmit={(event) => submitForm(event, `/api/owner/rates/${rate.id}`, "PATCH")} className="grid gap-3 border border-stone-200 p-4 sm:grid-cols-[1fr_1fr_9rem_8rem_auto_auto] sm:items-end">
              <p className="text-sm font-medium">{rate.unit_name}</p>
              <label className="text-sm font-medium">Starts<input required name="startsOn" type="date" defaultValue={rate.starts_on} className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>
              <label className="text-sm font-medium">Ends<input required name="endsOn" type="date" defaultValue={rate.ends_on} className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>
              <label className="text-sm font-medium">PHP / night<input required name="amountPesos" type="number" min="0" step="0.01" defaultValue={moneyInput(rate.amount_centavos)} className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>
              <button disabled={busy} className="min-h-10 border border-stone-900 px-3 text-sm font-semibold disabled:opacity-60" type="submit">Save</button>
              <button disabled={busy} onClick={() => archive(`/api/owner/rates/${rate.id}`, "Delete this nightly rate?")} className="min-h-10 border border-red-700 px-3 text-sm font-semibold text-red-700 disabled:opacity-60" type="button">Delete</button>
            </form>
          ))}
          {!rates.length && <p className="text-sm text-stone-600">No nightly rates yet.</p>}
        </div>
      </section>

      <section className="border border-stone-200 bg-white p-6">
        <h2 className="text-xl font-semibold">Blocked dates</h2>
        <form onSubmit={(event) => submitForm(event, "/api/owner/blocks")} className="mt-5 grid gap-3 border-b border-stone-200 pb-5 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
          <label className="text-sm font-medium">Room<select required name="unitId" className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal"><option value="">Choose room</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
          <label className="text-sm font-medium">Starts<input required name="startsOn" type="date" className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>
          <label className="text-sm font-medium">Ends<input required name="endsOn" type="date" className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>
          <label className="text-sm font-medium sm:col-span-3">Reason<input required name="reason" placeholder="Maintenance" className="mt-2 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>
          <button disabled={busy} className="min-h-10 bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-60" type="submit">Block dates</button>
        </form>
        <div className="mt-5 space-y-3">
          {blocks.map((block) => <div key={block.id} className="flex flex-wrap items-center justify-between gap-3 border border-stone-200 p-4 text-sm"><p><span className="font-medium">{block.unit_name}</span> · {block.starts_on} to {block.ends_on}<span className="ml-2 text-stone-600">{block.reason}</span></p><button disabled={busy} onClick={() => archive(`/api/owner/blocks/${block.id}`, "Remove this blocked date?")} className="border border-red-700 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-60" type="button">Remove</button></div>)}
          {!blocks.length && <p className="text-sm text-stone-600">No blocked dates yet.</p>}
        </div>
      </section>

      {message && <p role="status" className="text-sm text-stone-700">{message}</p>}
    </div>
  );
}
