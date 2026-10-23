import test from "node:test";
import assert from "node:assert/strict";
import { hasInventoryConflict } from "../../lib/availability.js";

const stay = (overrides = {}) => ({
  propertyId: "property-1",
  unitId: "room-1",
  rentalMode: "room",
  checkIn: "2026-11-10",
  checkOut: "2026-11-12",
  status: "confirmed",
  ...overrides,
});

test("room reservations conflict only on the same room", () => {
  assert.equal(hasInventoryConflict(stay(), stay()), true);
  assert.equal(hasInventoryConflict(stay(), stay({ unitId: "room-2" })), false);
});

test("room and entire-property reservations conflict within a property", () => {
  assert.equal(hasInventoryConflict(stay(), stay({ unitId: "property-unit", rentalMode: "entire_property" })), true);
  assert.equal(hasInventoryConflict(stay({ unitId: "property-unit", rentalMode: "entire_property" }), stay({ unitId: "room-2" })), true);
});

test("checkout and next check-in do not conflict", () => {
  assert.equal(hasInventoryConflict(stay(), stay({ checkIn: "2026-11-12", checkOut: "2026-11-14" })), false);
});
