export const clamp = (v: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, v));

export function jaccard(a: string[], b: string[]): number {
  const A = new Set(a.map((t) => t.toLowerCase()));
  const B = new Set(b.map((t) => t.toLowerCase()));
  const inter = [...A].filter((x) => B.has(x)).length;
  const uni = new Set([...A, ...B]).size;
  return uni === 0 ? 0 : inter / uni;
}

export function ageOverlapRatio(
  [minA, maxA]: [number, number],
  [minB, maxB]: [number, number],
): number {
  const min = Math.max(minA, minB);
  const max = Math.min(maxA, maxB);
  const overlap = Math.max(0, max - min);
  const base = Math.max(1, maxA - minA);
  return clamp(overlap / base);
}

export function minMaxNormalize(
  value: number,
  min: number,
  max: number,
): number {
  if (max === min) return 0.5;
  return clamp((value - min) / (max - min));
}
