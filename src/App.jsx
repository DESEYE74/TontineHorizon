import React, { useState } from "react";
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

export default function App() {
  const [screen, setScreen] = useState("login"); // login | app
  const [role, setRole] = useState("admin");
  const [me, setMe] = useState(null);
  const [nav, setNav] = useState("dashboard");
  const [chatOpen, setChatOpen] = useState(false);

  const enter = (mode, user) => {
    setRole(mode);
    setMe(user);
    setScreen("app");
    setNav("dashboard");
  };

  const logout = () => {
    setScreen("login");
    setChatOpen(false);
    setMe(null);
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
          <Shell role={role} active={nav} onNav={setNav} onLogout={logout} onChat={() => setChatOpen(true)}>
            {renderScreen()}
          </Shell>
          <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} role={role} me={me} />
        </>
      )}
    </>
  );
}
