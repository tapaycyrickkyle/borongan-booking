import test from "node:test";
import assert from "node:assert/strict";
import { checkoutPeriodKey, toCsv } from "../../lib/reports.js";

test("report period uses the scheduled checkout date in Asia/Manila", () => {
  assert.equal(checkoutPeriodKey("2026-11-30"), "2026-11");
  assert.equal(checkoutPeriodKey("2026-12-01T00:30:00+08:00"), "2026-12");
});

test("CSV escapes commas, quotes, and newlines", () => {
  const csv = toCsv([{ businessName: "Stay, Inc.", propertyTitle: "A \"quiet\" place", status: "completed", count: 1 }]);
  assert.equal(csv, "Business,Property,Status,Count\n\"Stay, Inc.\",\"A \"\"quiet\"\" place\",completed,1\n");
});
