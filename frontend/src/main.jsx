import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Context Providers
import { AuthProvider } from "./context/AuthContext";
import { ItemProvider } from "./context/ItemContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <ItemProvider>
        <App />
      </ItemProvider>
    </AuthProvider>
  </StrictMode>
);
