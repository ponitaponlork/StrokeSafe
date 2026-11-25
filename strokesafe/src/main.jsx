import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { LanguageProvider } from "./i18n/LanguageProvider.jsx";
import { RouterProvider } from "./lib/router.jsx";
import { CheckProvider } from "./lib/screening/CheckContext.jsx";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LanguageProvider>
      <RouterProvider>
        <CheckProvider>
          <App />
        </CheckProvider>
      </RouterProvider>
    </LanguageProvider>
  </StrictMode>
);

// Offline support (PWA): caches the app shell and the Emergency screen after the first visit.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
