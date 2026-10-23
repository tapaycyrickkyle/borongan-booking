import test from "node:test";
import assert from "node:assert/strict";
import { overlaps, parseStayDates } from "../../lib/dates.js";

test("parses checkout-exclusive stay dates", () => {
  assert.deepEqual(parseStayDates("2026-10-24", "2026-10-27"), {
    checkIn: "2026-10-24",
    checkOut: "2026-10-27",
    nights: 3,
    nightDates: ["2026-10-24", "2026-10-25", "2026-10-26"],
  });
});

test("supports leap-day stays", () => {
  assert.equal(parseStayDates("2028-02-28", "2028-03-01").nights, 2);
});

test("rejects a same-day or reversed stay", () => {
  assert.throws(() => parseStayDates("2026-10-25", "2026-10-25"), /check_out_after_check_in/);
  assert.throws(() => parseStayDates("2026-10-26", "2026-10-25"), /check_out_after_check_in/);
});

test("treats checkout and next check-in on the same date as non-overlapping", () => {
  assert.equal(overlaps("2026-10-24", "2026-10-27", "2026-10-27", "2026-10-29"), false);
  assert.equal(overlaps("2026-10-24", "2026-10-27", "2026-10-26", "2026-10-29"), true);
});
