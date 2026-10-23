import test from "node:test";
import assert from "node:assert/strict";
import { assertTransition, canTransition } from "../../lib/booking.js";

test("valid reservation transitions are explicit", () => {
  assert.equal(canTransition("pending", "confirmed"), true);
  assert.equal(canTransition("confirmed", "checked_in"), true);
  assert.equal(canTransition("checked_in", "completed"), true);
  assert.equal(canTransition("confirmed", "completed"), false);
  assert.equal(canTransition("completed", "completed"), false);
  assert.equal(canTransition("pending", "cancelled"), false);
});

test("completion requires checkout and cancellation request remains pending", () => {
  assert.throws(() => assertTransition("checked_in", "completed", {
    now: new Date("2026-11-11T00:00:00Z"),
    checkOut: "2026-11-12",
  }), /checkout_not_reached/);
  assert.doesNotThrow(() => assertTransition("pending", "cancellation_requested", {
    now: new Date("2026-11-11T00:00:00Z"),
    checkOut: "2026-11-12",
  }));
});

test("duplicate completion is rejected", () => {
  assert.throws(() => assertTransition("completed", "completed", {
    now: new Date("2026-11-13T00:00:00Z"),
    checkOut: "2026-11-12",
  }), /invalid_transition/);
});
