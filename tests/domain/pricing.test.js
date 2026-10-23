import test from "node:test";
import assert from "node:assert/strict";
import { resolveRateSnapshot } from "../../lib/pricing.js";

test("special rates take precedence over base rates", () => {
  const snapshot = resolveRateSnapshot({
    nightDates: ["2026-12-24", "2026-12-25"],
    baseRates: [{ startsOn: "2026-01-01", endsOn: "2027-01-01", amountCentavos: 250000 }],
    specialRates: [{ startsOn: "2026-12-25", endsOn: "2026-12-26", amountCentavos: 400000, label: "Christmas" }],
  });
  assert.deepEqual(snapshot.nights, [
    { date: "2026-12-24", amountCentavos: 250000, source: "base" },
    { date: "2026-12-25", amountCentavos: 400000, source: "special", label: "Christmas" },
  ]);
  assert.equal(snapshot.totalCentavos, 650000);
});

test("missing nightly rates are rejected", () => {
  assert.throws(() => resolveRateSnapshot({
    nightDates: ["2026-12-24", "2026-12-25"],
    baseRates: [{ startsOn: "2026-12-24", endsOn: "2026-12-25", amountCentavos: 250000 }],
    specialRates: [],
  }), /missing_rate/);
});
