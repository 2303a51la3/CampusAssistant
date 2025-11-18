// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

/**
 * DEV-ONLY FIX:
 * Ignore the ResizeObserver warning so CRA's red overlay
 * doesn’t treat it as a fatal runtime error.
 */
const filterResizeObserverError = (event) => {
  const msg = event?.message || "";

  if (
    msg.includes("ResizeObserver loop completed with undelivered notifications.") ||
    msg.includes("ResizeObserver loop limit exceeded")
  ) {
    // Stop this event so the React error overlay doesn't show it
    event.stopImmediatePropagation?.();
    event.preventDefault?.();
    return true;
  }
  return false;
};

if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    if (filterResizeObserverError(event)) return;
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reasonMsg = event?.reason?.message || "";
    if (
      reasonMsg.includes(
        "ResizeObserver loop completed with undelivered notifications."
      ) ||
      reasonMsg.includes("ResizeObserver loop limit exceeded")
    ) {
      event.stopImmediatePropagation?.();
      event.preventDefault?.();
    }
  });
}

// ---------- normal React bootstrap ----------
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
