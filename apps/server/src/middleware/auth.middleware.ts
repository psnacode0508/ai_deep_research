import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../db/supabase";
import { ApiError } from "./errorHandler";

/**
 * Authenticated user attached to req after JWT verification.
 * Mirrors Express.Request augmentation in types/express.d.ts.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

/**
 * requireAuth middleware
 *
 * Verifies the Supabase JWT from the Authorization header.
 * On success: attaches `req.user` and calls next().
 * On failure: returns a 401 ApiError.
 *
 * Usage:
 *   router.get("/me", requireAuth, getMe);
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Missing or malformed Authorization header", "MISSING_TOKEN");
    }

    const token = authHeader.slice(7); // Remove "Bearer "

    // Verify the JWT against Supabase — this also handles token expiry
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      throw new ApiError(401, "Invalid or expired authentication token", "INVALID_TOKEN");
    }

    const { user } = data;

    // Attach safe user info to req — never attach raw tokens
    req.user = {
      id: user.id,
      email: user.email ?? "",
      emailVerified: user.email_confirmed_at != null,
      createdAt: user.created_at,
    };

    next();
  } catch (err) {
    next(err);
  }
}
