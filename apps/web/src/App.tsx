import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RootLayout from "@/layouts/RootLayout";
import HomePage from "@/pages/HomePage";
import NotFoundPage from "@/pages/NotFoundPage";

/**
 * Application root.
 * Defines the top-level routing tree.
 * All page-level routes are nested inside RootLayout.
 */
function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
