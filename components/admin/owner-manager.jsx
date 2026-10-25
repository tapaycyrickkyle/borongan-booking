"use client";

import { useState } from "react";

function statusLabel(owner) { return owner.is_active ? "Active" : "Suspended"; }

export default function OwnerManager({ initialOwners }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function createOwner(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/admin/owners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
    setBusy(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setMessage(body.error === "owner_exists" ? "That email already has an account." : "Could not create the owner account.");
      return;
    }
    window.location.reload();
  }

  async function toggleOwner(owner) {
    setBusy(true);
    setMessage("");
    const status = owner.is_active ? "suspended" : "active";
    const response = await fetch("/api/admin/owners", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: owner.id, status }) });
    setBusy(false);
    if (!response.ok) {
      setMessage("Could not update the owner account.");
      return;
    }
    window.location.reload();
  }

  return <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
    <form onSubmit={createOwner} className="border border-stone-200 bg-white p-5">
      <h2 className="text-lg font-semibold">Create owner account</h2>
      <p className="mt-2 text-sm text-stone-600">Create login credentials for a business owner. No email verification is required.</p>
      <div className="mt-5 grid gap-4">
        <label className="text-sm font-medium">Name<input required name="name" className="mt-1 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>
        <label className="text-sm font-medium">Email<input required type="email" name="email" autoComplete="email" className="mt-1 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>
        <label className="text-sm font-medium">Temporary password<input required type="password" name="password" minLength="8" autoComplete="new-password" className="mt-1 min-h-10 w-full border border-stone-300 px-3 font-normal" /></label>
      </div>
      <button disabled={busy} className="mt-5 min-h-10 bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-60" type="submit">Create account</button>
      {message && <p role="alert" className="mt-4 text-sm text-red-700">{message}</p>}
    </form>
    <section>
      <h2 className="text-lg font-semibold">Owner accounts</h2>
      <div className="mt-3 overflow-x-auto border border-stone-200 bg-white">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50"><tr><th className="p-4">Owner</th><th className="p-4">Businesses</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead>
          <tbody>{initialOwners.map((owner) => <tr key={owner.id} className="border-b border-stone-100 last:border-0"><td className="p-4"><p className="font-medium">{owner.name}</p><p className="mt-1 text-stone-600">{owner.email}</p></td><td className="p-4">{owner.business_count}</td><td className="p-4">{statusLabel(owner)}</td><td className="p-4"><button disabled={busy} onClick={() => toggleOwner(owner)} className="border border-stone-900 px-3 py-2 text-xs font-semibold disabled:opacity-60" type="button">{owner.is_active ? "Suspend" : "Activate"}</button></td></tr>)}</tbody>
        </table>
        {!initialOwners.length && <p className="p-5 text-sm text-stone-600">No owner accounts yet.</p>}
      </div>
    </section>
  </div>;
}
