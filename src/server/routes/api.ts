import { Hono } from 'hono';
import { reddit } from '@devvit/web/server';
import { getStatus, recordSolve } from '../core/streak';
import type { SolveRequest, SolveResponse, StatusResponse } from '../../shared/api';

type ErrorResponse = {
  status: 'error';
  message: string;
};

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

  if (typeof body.timeMs !== 'number' || !Number.isFinite(body.timeMs) || body.timeMs < 0) {
    return c.json<ErrorResponse>({ status: 'error', message: 'timeMs must be a non-negative number' }, 400);
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
