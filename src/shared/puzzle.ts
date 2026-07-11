import { createRng, randInt, pick } from './rng.js';

export const SHAPES = ['circle', 'square', 'triangle', 'diamond'] as const;
export const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C'] as const;
export const ROTATIONS = [0, 90, 180, 270] as const;

// Shapes whose silhouette actually changes when rotated by 90/180/270.
// A circle looks the same at every rotation; a square and a diamond both have
// 90-degree rotational symmetry, so those turns are invisible on them too.
// Only the triangle (120-degree symmetry) shows a visible difference here.
const ROTATION_SAFE_SHAPES = SHAPES.filter((s) => s === 'triangle');

export type Shape = (typeof SHAPES)[number];
export type Color = (typeof COLORS)[number];
export type Rotation = (typeof ROTATIONS)[number];
export type DiffAttr = 'color' | 'shape' | 'rotation';

export type TileAppearance = {
  shape: Shape;
  color: Color;
  rotation: Rotation;
};

export type Puzzle = {
  seed: string;
  gridSize: number;
  totalTiles: number;
  oddIndex: number;
  diffAttr: DiffAttr;
  base: TileAppearance;
  odd: TileAppearance;
};

const DIFF_ATTRS: readonly DiffAttr[] = ['color', 'shape', 'rotation'];

// UTC date string, e.g. "2026-07-10". Using UTC (not local time) means every
// player worldwide gets the same seed for "today" regardless of timezone.
export function getDailySeed(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Picks a value from `options` that is different from `exclude`.
function pickDifferent<T>(rng: () => number, options: readonly T[], exclude: T): T {
  return pick(
    rng,
    options.filter((o) => o !== exclude)
  );
}

// Generates the full puzzle for a given date: grid size, which tile is odd,
// and the base/odd tile appearance. Same date -> same puzzle, always.
export function generatePuzzle(date: Date = new Date(), gridSize = 5): Puzzle {
  const seed = getDailySeed(date);
  const rng = createRng(seed);

  const totalTiles = gridSize * gridSize;
  const oddIndex = randInt(rng, totalTiles);

  // diffAttr is chosen before the base shape because a 'rotation' diff
  // constrains which shape is eligible (see ROTATION_SAFE_SHAPES above).
  const diffAttr = pick(rng, DIFF_ATTRS);

  const shapePool = diffAttr === 'rotation' ? ROTATION_SAFE_SHAPES : SHAPES;
  const base: TileAppearance = {
    shape: pick(rng, shapePool),
    color: pick(rng, COLORS),
    rotation: pick(rng, ROTATIONS),
  };

  const odd: TileAppearance = { ...base };
  if (diffAttr === 'color') odd.color = pickDifferent(rng, COLORS, base.color);
  if (diffAttr === 'shape') odd.shape = pickDifferent(rng, SHAPES, base.shape);
  if (diffAttr === 'rotation') odd.rotation = pickDifferent(rng, ROTATIONS, base.rotation);

  return { seed, gridSize, totalTiles, oddIndex, diffAttr, base, odd };
}
