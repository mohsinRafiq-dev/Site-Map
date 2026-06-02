import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./lib/auth";
import { prefetchCatalog } from "./lib/plansCatalog";
import App from "./App.jsx";
import "./index.css";

// Start fetching the plan catalog immediately — it will be warm by the
// time the user reaches Step 3, so no spinner in the floor plan picker.
prefetchCatalog();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
