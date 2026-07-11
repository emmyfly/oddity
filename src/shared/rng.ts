// Deterministic string -> PRNG. No dependencies, no Math.random.
// cyrb53: turns an arbitrary string into a 53-bit integer hash.
// mulberry32: turns that integer into a repeatable stream of floats in [0, 1).
// Same input string always produces the exact same sequence of numbers.

export function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Builds a repeatable RNG function from any string seed.
export function createRng(seedStr: string): () => number {
  const hash = cyrb53(seedStr) >>> 0;
  return mulberry32(hash);
}

// Pick an integer in [0, max) using the given rng.
export function randInt(rng: () => number, max: number): number {
  return Math.floor(rng() * max);
}

// Pick an element from a non-empty array using the given rng.
export function pick<T>(rng: () => number, options: readonly T[]): T {
  // Non-null: randInt is always < options.length, and options is never empty
  // for the callers in this codebase, so the index is always in bounds.
  return options[randInt(rng, options.length)]!;
}
