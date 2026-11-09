const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/;

/**
 * Uppercases, trims and inserts the single space before the inward code.
 * Returns null when the input is not a valid UK postcode.
 */
export function normalisePostcode(input: string): string | null {
  const compact = input.trim().toUpperCase().replace(/\s+/g, "");

  if (!UK_POSTCODE.test(compact)) return null;

  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

export function postcodeDistrict(input: string): string | null {
  const normalised = normalisePostcode(input);
  return normalised ? normalised.split(" ")[0] : null;
}
