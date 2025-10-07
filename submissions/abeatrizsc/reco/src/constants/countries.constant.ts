export const COUNTRIES = ['BR', 'PT', 'US', 'MX', 'AR'] as const;

export type CountryCodeType = (typeof COUNTRIES)[number];