import test from "node:test";
import assert from "node:assert/strict";
import { filterListingsByPrice, getBusinessInitials, groupUnitsByBusiness } from "../../lib/public.js";

test("creates compact business initials for logo fallbacks", () => {
  assert.equal(getBusinessInitials("Borongan Stays"), "BS");
  assert.equal(getBusinessInitials("Rooms"), "RO");
  assert.equal(getBusinessInitials(""), "BS");
});

test("groups published units by business and property", () => {
  const groups = groupUnitsByBusiness([
    { business_id: "business-1", business_name: "Borongan Stays", property_id: "property-1", title: "City Room", unit_id: "unit-1" },
    { business_id: "business-1", business_name: "Borongan Stays", property_id: "property-1", title: "City Room", unit_id: "unit-2" },
    { business_id: "business-2", business_name: "Seaside Rooms", property_id: "property-2", title: "Seaside House", unit_id: "unit-3" },
  ]);

  assert.deepEqual(groups.map((group) => group.business_name), ["Borongan Stays", "Seaside Rooms"]);
  assert.equal(groups[0].properties.length, 1);
  assert.equal(groups[0].properties[0].units.length, 2);
  assert.equal(groups[1].properties[0].units[0].unit_id, "unit-3");
});

test("filters listings by an inclusive nightly price range", () => {
  const listings = [
    { unit_id: "unit-1", price_per_night: 100000 },
    { unit_id: "unit-2", price_per_night: 150000 },
    { unit_id: "unit-3", price_per_night: 200000 },
    { unit_id: "unit-4", price_per_night: null },
  ];

  assert.deepEqual(
    filterListingsByPrice(listings, { minPrice: "1000", maxPrice: "2000" }).map((listing) => listing.unit_id),
    ["unit-1", "unit-2", "unit-3"],
  );
  assert.deepEqual(filterListingsByPrice(listings, { minPrice: "1500" }).map((listing) => listing.unit_id), ["unit-2", "unit-3"]);
  assert.equal(filterListingsByPrice(listings, { minPrice: "not-a-price" }).length, 4);
});
