// Entry point for the developer preview page (http://localhost:5173/preview.html).
// It does not touch your real app (index.html / src/main.jsx).
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./preview.css";
import { LanguageProvider } from "../i18n/LanguageProvider.jsx";
import { RouterProvider } from "../lib/router.jsx";
import Preview from "./Preview.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LanguageProvider>
      <RouterProvider>
        <Preview />
      </RouterProvider>
    </LanguageProvider>
  </StrictMode>
);
