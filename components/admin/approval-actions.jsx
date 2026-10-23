"use client";

import { useState } from "react";

export default function ApprovalActions({ propertyId }) { const [message, setMessage] = useState(""); async function update(status) { const response = await fetch(`/api/admin/properties/${propertyId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); setMessage(response.ok ? "Saved" : "Could not save"); if (response.ok) window.location.reload(); } return <div className="flex flex-wrap gap-2"><button onClick={() => update("published")} className="border border-emerald-700 px-3 py-2 text-xs font-semibold text-emerald-800">Publish</button><button onClick={() => update("rejected")} className="border border-red-700 px-3 py-2 text-xs font-semibold text-red-700">Reject</button>{message && <span className="text-xs text-stone-600">{message}</span>}</div>; }
