export const BRANDS = [
  'Nubank',
  'XP Investimentos',
  'SmartFit',
  'O Boticário',
  'Magalu',
  'Rappi',
  'Shein',
  'Netflix',
  'Petlove',
  'Samsung',
] as const;

export type BrandType = (typeof BRANDS)[number];