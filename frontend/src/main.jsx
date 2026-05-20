import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { AuthProvider } from "./providers/AuthProvider";
import "./styles/base.css";

// AuthProvider оборачивает всё приложение, чтобы routes и страницы могли читать текущую сессию.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
