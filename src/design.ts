/** Opt-in proportion study; existing URLs keep the current watch. */
export type DesignVariant = "baseline" | "dress1" | "sculptural" | "precise"
  | "dress1-clean" | "precise-optics" | "synthesis" | "warm" | "contained" | "combined";

export const corrected = (d: DesignVariant) => ["dress1-clean", "precise-optics", "synthesis", "warm", "contained", "combined"].includes(d);
export const physicalStudy = (d: DesignVariant) => ["synthesis", "warm", "contained", "combined"].includes(d);
export const preciseFamily = (d: DesignVariant) => d === "precise" || d === "precise-optics" || physicalStudy(d);
export const dressFamily = (d: DesignVariant) => d === "dress1" || d === "dress1-clean";
export const warmer = (d: DesignVariant) => d === "warm" || d === "combined";
export const containment = (d: DesignVariant) => d === "contained" || d === "combined";
/** Execution revision is independent of dial-temperature studies. */
export const executionFinish = () => typeof location !== 'undefined' && new URLSearchParams(location.search).get('finish') === 'execution' || physicalFinish();

/** Physical finishing on the selected face; no additional character lane. */
export const physicalFinish = () => typeof location !== 'undefined' && new URLSearchParams(location.search).get('finish') === 'physical' || seatingFinish();
export const seatingFinish = () => typeof location !== 'undefined' && new URLSearchParams(location.search).get('finish') === 'physical2';

export const arcStudy = () => seatingFinish() && new URLSearchParams(location.search).get('exploration') === 'arc';

export const LUG_FAMILIES = {
  arc: {label:'Arc', description:'Current waist and root transition.'},
  flow: {label:'Flow', description:'A longer sweep out of the case.'},
  crest: {label:'Crest', description:'A gently arched upper surface.'},
  taper: {label:'Taper', description:'A fuller, straighter middle.'},
} as const;
export type LugFamily = keyof typeof LUG_FAMILIES;
export function arcLugFamily(): LugFamily {
  const value=typeof location==='undefined'?null:new URLSearchParams(location.search).get('lug');
  return arcStudy() && (value==='flow'||value==='crest'||value==='taper') ? value : 'arc';
}

/** Coordinated choices for the two opt-in studies, all dimensions in mm. */
export const DESIGN_STUDIES = {
  sculptural: {
    label: "Soft Sculptural", dialCenter: "#fff9ed", dialEdge: "#f0e9dc",
    dialRoughness: 0.34, dialMetalness: 0.02, floor: 0xede9df,
    handColor: 0x1b304b, leatherColor: 0x886047, strapWidth: 18,
    strapTail: 16, padding: 0.24, lugTilt: -0.25,
    markerWidth: 0.5, markerLength: 2.05, twelveLength: 2.65,
    markerOuter: 15.25, bezelInset: 1.0,
  },
  precise: {
    label: "Precise Dress", dialCenter: "#f0e9d9", dialEdge: "#ddd4c0",
    dialRoughness: 0.42, dialMetalness: 0.12, floor: 0xe7e2d5,
    handColor: 0x152c45, leatherColor: 0x5e483b, strapWidth: 18,
    strapTail: 16, padding: -0.12, lugTilt: -0.21,
    markerWidth: 0.38, markerLength: 1.4, twelveLength: 1.65,
    markerOuter: 14.3, bezelInset: 0.78,
  },
} as const;

export function designStudy(design: DesignVariant) {
  return preciseFamily(design) ? DESIGN_STUDIES.precise : design === "sculptural" ? DESIGN_STUDIES.sculptural : null;
}

export function parseDesignVariant(value: string | null): DesignVariant {
  return ["dress1", "sculptural", "precise", "dress1-clean", "precise-optics", "synthesis", "warm", "contained", "combined"].includes(value ?? "") ? value as DesignVariant : "baseline";
}

export function designLabel(d: DesignVariant) {
  return ({baseline: "Nocturne 40", dress1: "Dress 1", sculptural: "Soft Sculptural", precise: "Precise Dress",
    "dress1-clean": "Dress 1 · corrected optics", "precise-optics": "Lane 3 · corrected optics",
    synthesis: "A · Corrected Lane 3", warm: "B · Warmer face", contained: "C · Greater containment",
    combined: "Warmth + containment"})[d];
}
