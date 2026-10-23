import { getDb } from "../../../../lib/db.js";
import { getGuestReservation } from "../../../../lib/guest-links.js";
import { consumeRateLimit } from "../../../../lib/rate-limit.js";

export async function GET(request, context) {
  const { reference } = await context.params;
  const token = new URL(request.url).searchParams.get("token");
  try {
    const address = request.headers.get("cf-connecting-ip") ?? "unknown";
    const limit = await consumeRateLimit({ scope: "guest-link", identifier: address, limit: 30, windowSeconds: 900 });
    if (!limit.allowed) return Response.json({ error: "too_many_requests" }, { status: 429 });
    const reservation = await getGuestReservation(await getDb(), token);
    if (!reservation || reservation.reference_number !== reference) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json({ reservation });
  } catch {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
}
