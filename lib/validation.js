import { z } from "zod";
import { parseStayDates } from "./dates.js";

const reservationSchema = z.object({
  guestName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(5).max(30),
  guestCount: z.coerce.number().int().min(1).max(50),
  checkIn: z.string(),
  checkOut: z.string(),
  propertyType: z.enum(["transient_house", "apartment", "room"]),
  rentalMode: z.enum(["room", "entire_property"]),
});

export function validateReservationInput(input) {
  try {
    const parsed = reservationSchema.parse(input);
    parseStayDates(parsed.checkIn, parsed.checkOut);
    return parsed;
  } catch {
    throw new Error("invalid_reservation_input");
  }
}

export function normalizeMoneyToCentavos(value) {
  const text = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    throw new Error("invalid_money");
  }

  const [whole, fraction = ""] = text.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function validateImageUpload(file) {
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!file || !allowedTypes.has(file.type)) {
    throw new Error("invalid_image_type");
  }
  if (!Number.isInteger(file.size) || file.size < 1) {
    throw new Error("invalid_image_size");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("image_too_large");
  }

  return { contentType: file.type, byteLength: file.size };
}
