import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

/**
 * useAuth hook — access authentication state and methods anywhere in the app.
 *
 * Must be used inside <AuthProvider>. Throws a clear error if used outside
 * so misconfiguration is caught immediately during development.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error(
      "useAuth() must be used inside <AuthProvider>.\n" +
        "Make sure AuthProvider wraps your application in App.tsx."
    );
  }
  return ctx;
}
