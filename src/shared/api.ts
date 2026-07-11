export type SolveRequest = {
  timeMs: number;
};

export type SolveResponse = {
  type: 'solve';
  streak: number;
  bestTimeMs: number;
  isNewBest: boolean;
};

export type StatusResponse = {
  type: 'status';
  alreadySolvedToday: boolean;
  streak: number;
  bestTimeMs: number;
  lastTimeMs: number;
};
