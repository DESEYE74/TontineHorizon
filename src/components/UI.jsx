import React from "react";
import { T, ROTATION_META, PAYMENT_META } from "../theme.jsx";

export function RotationWheel({ members, currentTurn, amount, currency, size = 340 }) {
  const radius = size / 2 - 44;
  const center = size / 2;
  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size} style={{ position: "absolute", inset: 0 }}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke={T.inkLine} strokeWidth="1.5" strokeDasharray="2 6" />
      </svg>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", width: 132 }}>
        <p className="f-body" style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#8B93B8", margin: 0 }}>
          Tour {currentTurn} sur {members.length}
        </p>
        <p className="f-mono" style={{ fontSize: 22, fontWeight: 600, color: "#fff", margin: "4px 0 0" }}>
          {amount.toLocaleString("fr-FR")}
        </p>
        <p className="f-body" style={{ fontSize: 12, color: "#8B93B8", margin: 0 }}>{currency} / part</p>
      </div>
      {members.map((m, i) => {
        const angle = (i / members.length) * 2 * Math.PI - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        const isCurrent = m.turn === currentTurn;
        return (
          <div key={m.id} style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)" }}>
            <div style={{
              width: isCurrent ? 46 : 38, height: isCurrent ? 46 : 38, borderRadius: "50%",
              background: isCurrent ? T.gold : T.inkPanel,
              border: `2px solid ${isCurrent ? T.goldSoft : T.inkLine}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "Inter", fontWeight: 600, fontSize: isCurrent ? 13 : 11,
              color: isCurrent ? "#2A2205" : "#C7CCE3",
              boxShadow: isCurrent ? "0 0 0 6px rgba(201,162,39,0.18)" : "none",
            }}>
              {m.initials}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// variant="rotation" (défaut) : Reçu / Bénéficiaire du tour / À venir
// variant="payment" : Payé / En retard
export function Pill({ status, variant = "rotation" }) {
  const source = variant === "payment" ? PAYMENT_META : ROTATION_META;
  const meta = source[status] ?? ROTATION_META.upcoming;
  return (
    <span className="f-body" style={{
      display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600,
      color: meta.color, background: meta.tint, padding: "4px 10px", borderRadius: 999,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color }} />
      {meta.label}
    </span>
  );
}

export function StatCard({ label, value, sub, icon: Icon }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: "18px 20px", flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p className="f-body" style={{ fontSize: 13, color: T.textSoft, margin: 0 }}>{label}</p>
        {Icon && <Icon size={16} color={T.textSoft} />}
      </div>
      <p className="f-mono" style={{ fontSize: 24, fontWeight: 600, margin: "8px 0 0", color: T.text }}>{value}</p>
      {sub && <p className="f-body" style={{ fontSize: 12.5, color: T.textSoft, margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );
}

export function Screen({ title, subtitle, children, action }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
        <div>
          <h2 className="f-display" style={{ fontSize: 24, margin: 0, color: T.text }}>{title}</h2>
          {subtitle && <p style={{ color: T.textSoft, fontSize: 13.5, margin: "4px 0 0" }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
