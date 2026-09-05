/** Small same-origin protocol shared by the comparison page and its viewers. */
export const COMPARISON_VIEWS = ["dial", "wrist", "oblique", "side", "lug", "seconds", "back", "rake", "strapedge", "loopside", "crown3"] as const;
export const COMPARISON_LIGHTS = ["warm", "neutral"] as const;
export const COMPARISON_POSES = ["ten-ten", "ten-thirty-eight"] as const;
export type ComparisonSettings = {
  type: "nocturne:compare";
  view: (typeof COMPARISON_VIEWS)[number];
  light: (typeof COMPARISON_LIGHTS)[number];
  pose: (typeof COMPARISON_POSES)[number];
  sweep?: boolean;
};
export function isComparisonSettings(value: unknown): value is ComparisonSettings {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return v.type === "nocturne:compare"
    && (v.sweep === undefined || typeof v.sweep === 'boolean')
    && COMPARISON_VIEWS.some(x => x === v.view)
    && COMPARISON_LIGHTS.some(x => x === v.light)
    && COMPARISON_POSES.some(x => x === v.pose);
}
