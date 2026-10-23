import { createGuestReservation } from "../../../lib/booking.js";
import { consumeRateLimit } from "../../../lib/rate-limit.js";

function clientAddress(request) {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(request) {
  try {
    const address = clientAddress(request);
    const limit = await consumeRateLimit({ scope: "reservation", identifier: address, limit: 8, windowSeconds: 900 });
    if (!limit.allowed) return Response.json({ error: "too_many_requests" }, { status: 429 });
    const input = await request.json();
    const result = await createGuestReservation(input, request);
    return Response.json(result, { status: 201 });
  } catch (error) {
    const code = String(error?.message ?? "reservation_failed");
    const status = ["invalid_reservation_input", "listing_unavailable", "dates_unavailable"].includes(code) ? 400 : 500;
    return Response.json({ error: status === 500 ? "reservation_failed" : code }, { status });
  }
}
