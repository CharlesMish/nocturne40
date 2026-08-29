import * as THREE from "three";
import type { AnimatedPart, Movement } from "./movement";

export const GOING_TRAIN_PART_NAMES = [
  "barrel",
  "center",
  "third",
  "fourth",
  "escape",
] as const;

export type GoingTrainPartName = (typeof GOING_TRAIN_PART_NAMES)[number];

export type GoingTrainCore = {
  root: THREE.Group;
  parts: Record<GoingTrainPartName, AnimatedPart>;
};

/**
 * Detach only the five certified going-train arbors from an RC1 Movement.
 * Keep the Movement object: its update(time) method continues to drive the
 * detached motion pivots with the accepted signed compound ratios.
 */
export function extractGoingTrainCore(movement: Movement): GoingTrainCore {
  const root = new THREE.Group();
  root.name = "going-train-core-v1";

  const parts = Object.fromEntries(
    GOING_TRAIN_PART_NAMES.map((name) => {
      const part = movement.parts[name];
      root.add(part.pose);
      return [name, part];
    }),
  ) as Record<GoingTrainPartName, AnimatedPart>;

  return { root, parts };
}
