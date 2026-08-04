import React, { useEffect, useState } from "react";
import { Wallet, Users, CalendarDays, Receipt, LogOut, Sparkles, CreditCard, Menu, X } from "lucide-react";
import { T } from "../theme.jsx";
import { TONTINE } from "../data/mock.js";
import { fetchTontineSettings } from "../data/api.js";
import logoUrl from "../assets/logo.png";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 760 : false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 760);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

export default function Shell({ role, active, onNav, onLogout, onChat, children }) {
  const [name, setName] = useState(TONTINE.name);
  const isMobile = useIsMobile();
  const [navOpen, setNavOpen] = useState(true);

  useEffect(() => {
    fetchTontineSettings().then((t) => setName(t.name)).catch(() => {});
  }, []);

  // Sur mobile, on referme le menu après avoir choisi un onglet pour
  // libérer l'écran ; sur ordinateur, il reste ouvert (l'utilisateur peut
  // quand même le réduire volontairement avec le bouton ☰).
  const handleNav = (key) => {
    onNav(key);
    if (isMobile) setNavOpen(false);
  };

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
    <div className="f-body app-shell" style={{ background: T.stone }}>
      <div
        className="app-sidebar"
        style={{
          background: T.ink,
          padding: navOpen ? "22px 16px" : "14px 10px",
          display: "flex",
          flexDirection: "column",
          width: !navOpen && !isMobile ? 64 : undefined,
          transition: "width .15s ease, padding .15s ease",
        }}
      >
        <div className="app-sidebar-header" style={{
          display: "flex", alignItems: "center",
          justifyContent: navOpen ? "space-between" : "center",
          gap: 8, padding: navOpen ? "0 8px 22px" : "0 0 14px",
        }}>
          {navOpen && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <img src={logoUrl} alt="" style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <p className="f-display" style={{ color: "#fff", fontSize: 15, fontStyle: "italic", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</p>
                <p style={{ color: "#8B93B8", fontSize: 10.5, margin: 0, whiteSpace: "nowrap" }}>
                  {role === "admin" ? "Espace administrateur" : "Espace membre · lecture seule"}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => setNavOpen((o) => !o)}
            aria-label={navOpen ? "Réduire le menu" : "Afficher le menu"}
            title={navOpen ? "Réduire le menu" : "Afficher le menu"}
            style={{
              background: "transparent", border: `1px solid ${T.inkLine}`, borderRadius: 8, width: 32, height: 32,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
            }}
          >
            {navOpen ? <X size={15} color="#C7CCE3" /> : <Menu size={16} color="#C7CCE3" />}
          </button>
        </div>

        {navOpen && (
          <>
            <div className="app-nav-list">
              {nav.map((n) => (
                <button key={n.key} onClick={() => handleNav(n.key)} style={{
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
            <div className="app-sidebar-footer" style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={onChat} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 9,
                border: `1px solid ${T.inkLine}`, cursor: "pointer", background: "transparent",
                color: T.gold, fontSize: 13.5, fontWeight: 600,
              }}>
                <Sparkles size={15} /> Assistant
              </button>
              <button onClick={onLogout} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 9,
                border: "none", cursor: "pointer", background: "transparent", color: "#8B93B8", fontSize: 13,
              }}>
                <LogOut size={15} /> Se déconnecter
              </button>
            </div>
          </>
        )}

        {!navOpen && !isMobile && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
            {nav.map((n) => (
              <button key={n.key} onClick={() => handleNav(n.key)} title={n.label} style={{
                width: 36, height: 36, borderRadius: 9, border: "none", cursor: "pointer",
                background: active === n.key ? T.inkPanel : "transparent",
                color: active === n.key ? "#fff" : "#9AA1C4",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <n.icon size={16} />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="app-main">{children}</div>
    </div>
  );
}
