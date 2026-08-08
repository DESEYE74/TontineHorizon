import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// Nettoyage ponctuel : désinstalle l'ancien service worker (mode hors-ligne,
// retiré) qui pourrait encore tourner sur certains appareils, pour éviter
// qu'une ancienne version de l'application ne reste bloquée en cache.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    if (regs.length > 0) {
      regs.forEach((r) => r.unregister());
      if ("caches" in window) {
        caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
      }
      window.location.reload();
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
