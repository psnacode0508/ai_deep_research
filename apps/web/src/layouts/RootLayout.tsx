import React from "react";
import { Outlet } from "react-router-dom";

/**
 * RootLayout
 *
 * Top-level shell wrapping all pages.
 * In a future milestone this will include:
 *   - Navigation bar
 *   - Auth state provider
 *   - Toast notifications
 *   - SSE event listener
 *
 * For now it renders <Outlet /> with a subtle background.
 */
function RootLayout(): React.JSX.Element {
  return (
    <div className="min-h-dvh flex flex-col">
      <Outlet />
    </div>
  );
}

export default RootLayout;
