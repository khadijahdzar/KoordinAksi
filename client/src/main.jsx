import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/AuthContext";
import SmoothScroll from "./components/SmoothScroll";
import App from "./App";
import "./styles.css";
import "./activity-detail-fix.css";
import "./nav-motion.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="556610423581-7jlqlqe9ljov699gtveoga9oa9q999ht.apps.googleusercontent.com">
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <SmoothScroll>
            <App />
          </SmoothScroll>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
