import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  registerSW({ immediate: true });
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
