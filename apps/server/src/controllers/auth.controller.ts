import { Request, Response } from "express";
import type { AuthUser } from "@deepresearch/shared";

/**
 * GET /api/v1/auth/me
 *
 * Returns safe user information for the currently authenticated user.
 * The `requireAuth` middleware must run before this handler —
 * it guarantees `req.user` is populated.
 *
 * Never returns raw tokens, passwords, or internal Supabase metadata.
 */
export function getMe(req: Request, res: Response): void {
  // req.user is guaranteed by requireAuth middleware
  const user = req.user!;

  const body: { success: true; data: AuthUser } = {
    success: true,
    data: {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    },
  };

  res.status(200).json(body);
}
