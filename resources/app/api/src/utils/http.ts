import { Response } from 'express';

export function badRequest(res: Response, error: string): Response {
  return res.status(400).json({ error });
}

export function notFound(res: Response, error: string): Response {
  return res.status(404).json({ error });
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
