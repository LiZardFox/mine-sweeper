export function calculateDenityForDimensions(dimensions: number[]): { min: number; max: number } {
  const dims = dimensions.filter((d) => d > 2).length;
  const min = Math.max(Math.min(0.2 * 0.5 ** dims, 0.2), 0);
  const max = Math.min(0.6 ** dims, 0.6);
  return { min, max };
}
