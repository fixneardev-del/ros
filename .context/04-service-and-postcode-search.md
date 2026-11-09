# 04 – Service and Postcode Search

**Phase:** 2 | **Est.:** 8–10 hrs

## Purpose
Customers find approved local providers by service and postcode, within the pilot area.

## Approach (budget-appropriate)
Use a **pilot coverage table** of enabled postcode districts (e.g. G12, G11, G3, G4 – client to confirm) rather than distance calculations. Optional free postcode lookup API to validate input.

## Data model
`locations`: id, postcode_district, area_name, is_enabled

## Functional requirements
1. Search inputs: service (category) and postcode.
2. Normalise and validate UK postcode format.
3. Extract the postcode district and check it against enabled locations.
4. If outside pilot: show message "We're starting in Glasgow's West End and selected university communities" and offer an interest/waitlist capture (email only).
5. If inside: list approved providers offering the category whose service areas include that district.
6. Results show provider name, categories, short bio, thumbnail, link to profile.
7. Empty state and "Post a job instead" call to action.
8. Admin can enable/disable postcode districts.

## Acceptance criteria
- [ ] Valid pilot postcode + category returns only approved, active providers
- [ ] Invalid postcode shows a clear error
- [ ] Non-pilot postcode shows the pilot message
- [ ] Unapproved or suspended providers never appear

## Exclusions
Distance radius, maps, geolocation, nationwide coverage, ranking algorithms.
