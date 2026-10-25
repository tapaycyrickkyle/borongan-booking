const mockBusinessDefinitions = [
  ["Bayview Rest House", "A quiet stay near the coast.", "transient_house"],
  ["Sunrise Haven", "Bright rooms for short city stays.", "apartment"],
  ["Borongan Central Suites", "Comfortable suites close to town.", "apartment"],
  ["Seaside Nook", "Simple rooms with a relaxed atmosphere.", "room"],
  ["Eastern Samar Lodge", "Spacious lodging for families and groups.", "transient_house"],
  ["Casa Verde Rooms", "Clean, practical rooms for travelers.", "room"],
  ["Pacific View Apartments", "Modern apartments with everyday comforts.", "apartment"],
  ["City Garden Stay", "A convenient room in the city center.", "room"],
  ["Riverside Rooms", "A peaceful place for an easy overnight stay.", "room"],
  ["Mariposa Transient House", "A welcoming home base in Borongan.", "transient_house"],
];

export const mockGroups = mockBusinessDefinitions.map(([name, description, propertyType], index) => {
  const businessId = `mock-business-${index + 1}`;
  const propertyId = `mock-property-${index + 1}`;
  const units = Array.from({ length: (index % 4) + 1 }, (_, unitIndex) => ({
    id: `mock-unit-${index + 1}-${unitIndex + 1}`,
    name: `Room ${unitIndex + 1}`,
    rental_mode: "room",
    capacity: 2 + (unitIndex % 3),
    price_per_night: 150000 + (index * 5000) + (unitIndex * 2500),
    unit_image_key: null,
  }));

  return {
    business_id: businessId,
    business_name: name,
    business_description: description,
    properties: [{
      business_id: businessId,
      business_name: name,
      property_id: propertyId,
      slug: propertyId,
      title: name,
      property_type: propertyType,
      property_rental_mode: "room",
      location_text: "Borongan City, Eastern Samar",
      short_description: description,
      property_capacity: 4,
      property_image_key: null,
      business_logo_key: null,
      units,
    }],
  };
});

export function getMockBusiness(id) {
  return mockGroups.find((group) => group.business_id === id) ?? null;
}
