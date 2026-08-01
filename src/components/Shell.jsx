import React, { useEffect, useState } from "react";
import { Wallet, Users, CalendarDays, Receipt, LogOut, Sparkles, CreditCard } from "lucide-react";
import { T } from "../theme.jsx";
import { TONTINE } from "../data/mock.js";
import { fetchTontineSettings } from "../data/api.js";
import logoUrl from "../assets/logo.png";

export default function Shell({ role, active, onNav, onLogout, onChat, children }) {
  const [name, setName] = useState(TONTINE.name);

  useEffect(() => {
    fetchTontineSettings().then((t) => setName(t.name)).catch(() => {});
  }, []);

  const adminNav = [
    { key: "dashboard", label: "Tableau de bord", icon: Wallet },
    { key: "members", label: "Membres", icon: Users },
    { key: "payments", label: "Versements", icon: CreditCard },
    { key: "calendar", label: "Calendrier", icon: CalendarDays },
    { key: "receipts", label: "Reçus", icon: Receipt },
  ];
  const memberNav = [
    { key: "dashboard", label: "Ma situation", icon: Wallet },
    { key: "calendar", label: "Calendrier du groupe", icon: CalendarDays },
    { key: "receipts", label: "Mes reçus", icon: Receipt },
  ];
  const nav = role === "admin" ? adminNav : memberNav;

  return (
    <div className="f-body" style={{ display: "flex", minHeight: "100vh", background: T.stone }}>
      <div style={{ width: 220, background: T.ink, padding: "22px 16px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 22px" }}>
          <img src={logoUrl} alt="" style={{ width: 32, height: 32, objectFit: "contain" }} />
          <div>
            <p className="f-display" style={{ color: "#fff", fontSize: 15, fontStyle: "italic", margin: 0 }}>{name}</p>
            <p style={{ color: "#8B93B8", fontSize: 10.5, margin: 0 }}>
              {role === "admin" ? "Espace administrateur" : "Espace membre · lecture seule"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {nav.map((n) => (
            <button key={n.key} onClick={() => onNav(n.key)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 9,
              border: "none", cursor: "pointer", textAlign: "left",
              background: active === n.key ? T.inkPanel : "transparent",
              color: active === n.key ? "#fff" : "#9AA1C4", fontSize: 13.5, fontWeight: 500,
            }}>
              <n.icon size={16} />
              {n.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={onChat} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 9,
            border: `1px solid ${T.inkLine}`, cursor: "pointer", background: "transparent",
            color: T.gold, fontSize: 13.5, fontWeight: 600,
          }}>
            <Sparkles size={15} /> Assistant
          </button>
          <button onClick={onLogout} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 9,
            border: "none", cursor: "pointer", background: "transparent", color: "#8B93B8", fontSize: 13,
          }}>
            <LogOut size={15} /> Se déconnecter
          </button>
        </div>
      </div>
      <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>{children}</div>
    </div>
  );
}
