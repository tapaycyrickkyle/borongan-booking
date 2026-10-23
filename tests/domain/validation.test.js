import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeMoneyToCentavos,
  validateImageUpload,
  validateReservationInput,
} from "../../lib/validation.js";

test("normalizes reservation input at the trust boundary", () => {
  assert.deepEqual(
    validateReservationInput({
      guestName: "  Ana Cruz ",
      email: " ANA@EXAMPLE.COM ",
      phone: " 09171234567 ",
      guestCount: "2",
      checkIn: "2026-10-24",
      checkOut: "2026-10-27",
      propertyType: "apartment",
      rentalMode: "entire_property",
    }),
    {
      guestName: "Ana Cruz",
      email: "ana@example.com",
      phone: "09171234567",
      guestCount: 2,
      checkIn: "2026-10-24",
      checkOut: "2026-10-27",
      propertyType: "apartment",
      rentalMode: "entire_property",
    },
  );
});

test("rejects invalid guest count and unsupported listing values", () => {
  assert.throws(
    () => validateReservationInput({ guestName: "Ana", email: "ana@example.com", phone: "0917", guestCount: 0, checkIn: "2026-10-24", checkOut: "2026-10-27", propertyType: "hotel", rentalMode: "room" }),
    /invalid_reservation_input/,
  );
});

test("normalizes PHP values to integer centavos", () => {
  assert.equal(normalizeMoneyToCentavos("1250.50"), 125050);
  assert.equal(normalizeMoneyToCentavos(0), 0);
  assert.throws(() => normalizeMoneyToCentavos("12.345"), /invalid_money/);
});

test("allows only supported image formats under 10 MB", () => {
  assert.deepEqual(validateImageUpload({ type: "image/webp", size: 1024 }), {
    contentType: "image/webp",
    byteLength: 1024,
  });
  assert.throws(() => validateImageUpload({ type: "image/svg+xml", size: 10 }), /invalid_image_type/);
  assert.throws(() => validateImageUpload({ type: "image/jpeg", size: 10 * 1024 * 1024 + 1 }), /image_too_large/);
});
