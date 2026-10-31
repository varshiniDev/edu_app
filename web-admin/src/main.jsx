import React from "react"; import { createRoot } from "react-dom/client"; import { BrowserRouter } from "react-router-dom";
import "./index.css"; import App from "./App.jsx"; import { BrandingProvider } from "./branding.jsx"; import { ToastProvider } from "./components/ui.jsx";
createRoot(document.getElementById("root")).render(<BrowserRouter><BrandingProvider><ToastProvider><App/></ToastProvider></BrandingProvider></BrowserRouter>);
