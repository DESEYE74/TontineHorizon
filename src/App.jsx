import React, { useEffect, useState } from "react";
import { GlobalFonts } from "./theme.jsx";
import Login from "./components/Login.jsx";
import Shell from "./components/Shell.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import MemberDashboard from "./components/MemberDashboard.jsx";
import PaymentsView from "./components/PaymentsView.jsx";
import MembersView from "./components/MembersView.jsx";
import CalendarView from "./components/CalendarView.jsx";
import ReceiptsView from "./components/ReceiptsView.jsx";
import ChatDrawer from "./components/ChatDrawer.jsx";
import OfflineBanner from "./components/OfflineBanner.jsx";
import { watchConnectivity } from "./lib/sync.js";

const SESSION_KEY = "tontine_session";

export default function App() {
  const [screen, setScreen] = useState("login"); // login | app
  const [role, setRole] = useState("admin");
  const [me, setMe] = useState(null);
  const [nav, setNav] = useState("dashboard");
  const [chatOpen, setChatOpen] = useState(false);

  // Session persistante : permet de rouvrir l'application (même hors-ligne)
  // sans avoir à se reconnecter à chaque fois sur le même appareil.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      if (saved?.role) {
        setRole(saved.role);
        setMe(saved.me ?? null);
        setScreen("app");
      }
    } catch {
      // session locale corrompue ou absente : on reste sur l'écran de connexion
    }
  }, []);

  // Synchronise les actions faites hors-ligne dès que la connexion revient.
  useEffect(() => {
    const stop = watchConnectivity((count) => {
      window.dispatchEvent(new CustomEvent("tontine-synced", { detail: { count } }));
    });
    return stop;
  }, []);

  const enter = (mode, user) => {
    setRole(mode);
    setMe(user);
    setScreen("app");
    setNav("dashboard");
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ role: mode, me: user }));
    } catch {
      // stockage local indisponible : la session ne survivra pas à une fermeture, sans gravité
    }
  };

  const logout = () => {
    setScreen("login");
    setChatOpen(false);
    setMe(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {}
  };

  const renderScreen = () => {
    if (nav === "receipts") return <ReceiptsView role={role} me={me} />;
    if (nav === "calendar") return <CalendarView role={role} />;
    if (role === "admin") {
      if (nav === "payments") return <PaymentsView />;
      if (nav === "members") return <MembersView />;
      return <AdminDashboard />;
    }
    return <MemberDashboard me={me} />;
  };

  return (
    <>
      <GlobalFonts />
      {screen === "login" && <Login onEnter={enter} />}
      {screen === "app" && (
        <>
          <OfflineBanner />
          <Shell role={role} active={nav} onNav={setNav} onLogout={logout} onChat={() => setChatOpen(true)}>
            {renderScreen()}
          </Shell>
          <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} role={role} />
        </>
      )}
    </>
  );
}
