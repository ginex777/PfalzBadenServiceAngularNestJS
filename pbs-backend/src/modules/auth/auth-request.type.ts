import type { Request } from 'express';

export type AuthenticatedUser = {
  id?: bigint;
  email: string;
  rolle: string;
  fullName?: string;
  mitarbeiterId?: number | null;
};

export type AuthRequest = Request & {
  user?: AuthenticatedUser;
};
