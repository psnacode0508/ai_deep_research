import type { AuthenticatedUser } from "../middleware/auth.middleware";

/**
 * Express Request augmentation.
 *
 * Adds `user` property populated by the `requireAuth` middleware.
 * Using `declare global` ensures this augments the correct namespace
 * without creating a new module scope.
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
