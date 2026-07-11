import { Hono } from 'hono';
import { reddit } from '@devvit/web/server';
import { getStatus, recordSolve } from '../core/streak';
import type { SolveRequest, SolveResponse, StatusResponse } from '../../shared/api';

type ErrorResponse = {
  status: 'error';
  message: string;
};

// Below this, a "solve" isn't physically plausible (locate one odd tile among
// 25 and tap it) — reject it rather than let a direct API call fake a time.
// This is a floor, not real anti-cheat: a replayed/adjusted-but-plausible
// time can't be caught this way. Good enough for a hackathon MVP.
const MIN_PLAUSIBLE_SOLVE_MS = 300;

export const api = new Hono();

api.get('/status', async (c) => {
  const username = await reddit.getCurrentUsername();
  if (!username) {
    return c.json<ErrorResponse>({ status: 'error', message: 'Must be logged in' }, 401);
  }

  try {
    const result = await getStatus(username);
    return c.json<StatusResponse>(result);
  } catch (error) {
    console.error(`API Status Error for user ${username}:`, error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Failed to fetch status' }, 500);
  }
});

api.post('/solve', async (c) => {
  const body = await c.req.json<SolveRequest>();

  if (typeof body.timeMs !== 'number' || !Number.isFinite(body.timeMs) || body.timeMs < MIN_PLAUSIBLE_SOLVE_MS) {
    return c.json<ErrorResponse>(
      { status: 'error', message: `timeMs must be a realistic solve time (>= ${MIN_PLAUSIBLE_SOLVE_MS}ms)` },
      400
    );
  }

  const username = await reddit.getCurrentUsername();
  if (!username) {
    return c.json<ErrorResponse>({ status: 'error', message: 'Must be logged in to record a solve' }, 401);
  }

  try {
    const result = await recordSolve(username, body.timeMs);
    return c.json<SolveResponse>({ type: 'solve', ...result });
  } catch (error) {
    console.error(`API Solve Error for user ${username}:`, error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Failed to record solve' }, 500);
  }
});
