import React, { useEffect, useState } from "react";
import { X, Send, Sparkles } from "lucide-react";
import { T } from "../theme.jsx";
import { TONTINE } from "../data/mock.js";
import { fetchTontineSettings, fetchMembers, fetchPaymentsForTurn } from "../data/api.js";
import { rotationStatus, paymentStatus } from "../lib/rotation.js";

// Construit un résumé compact et réel de l'état de la tontine, envoyé à
// l'assistant pour qu'il réponde à partir des vraies données (pas de texte
// générique). Sert aussi de base aux réponses de secours hors-ligne/sans clé API.
async function buildContext(role, me) {
  const tontine = await fetchTontineSettings();
  const members = await fetchMembers();
  const currentTurn = tontine.currentTurn ?? 1;
  const payments = await fetchPaymentsForTurn(currentTurn);

  const withStatus = members.map((m) => ({
    name: m.name,
    turn: m.turn,
    rotation: rotationStatus(m.turn, currentTurn), // received | current | upcoming
    payment: paymentStatus(m.id, currentTurn, payments), // paid | late
  }));

  const base = {
    tontine: {
      nom: tontine.name, montant: tontine.amount, devise: tontine.currency, frequence: tontine.frequency,
      cycle: tontine.cycleNumber ?? 1, tourEnCours: currentTurn, nombreDeTours: members.length,
    },
  };

  if (role === "admin") {
    return { ...base, membres: withStatus };
  }
  const self = withStatus.find((m) => m.name === me?.name) ?? null;
  return { ...base, moi: self, membres: withStatus.map((m) => ({ name: m.name, turn: m.turn, rotation: m.rotation })) };
}

function localFallback(text, ctx, role) {
  const q = text.toLowerCase();
  if (!ctx) return "Je n'ai pas encore les données en main, réessayez dans un instant.";

  if (role === "admin") {
    if (q.includes("retard")) {
      const late = ctx.membres.filter((m) => m.payment === "late").map((m) => m.name);
      return late.length ? `N'ont pas encore versé ce tour : ${late.join(", ")}.` : "Tout le monde a versé sa part pour ce tour.";
    }
    if (q.includes("caisse") || q.includes("résume") || q.includes("resume")) {
      const paidCount = ctx.membres.filter((m) => m.payment === "paid").length;
      return `Tour ${ctx.tontine.tourEnCours} sur ${ctx.tontine.nombreDeTours} (cycle ${ctx.tontine.cycle}) : ${paidCount}/${ctx.membres.length} membres ont versé, soit ${(paidCount * ctx.tontine.montant).toLocaleString("fr-FR")} ${ctx.tontine.devise} collectés.`;
    }
  } else {
    if (q.includes("versé") && ctx.moi) {
      return ctx.moi.payment === "paid" ? "Vous avez déjà versé votre cotisation pour ce tour." : "Vous n'avez pas encore versé votre cotisation pour ce tour.";
    }
    if (q.includes("tour") && ctx.moi) {
      if (ctx.moi.rotation === "current") return "C'est votre tour : vous êtes le bénéficiaire ce tour-ci.";
      if (ctx.moi.rotation === "received") return "Vous avez déjà reçu la caisse lors d'un tour précédent de ce cycle.";
      const wait = (ctx.moi.turn - ctx.tontine.tourEnCours + ctx.tontine.nombreDeTours) % ctx.tontine.nombreDeTours;
      return `Votre tour arrive dans ${wait} tour(s) (vous êtes en position ${ctx.moi.turn}).`;
    }
  }
  return "Je n'ai pas de réponse précise à cette question pour le moment — vous pouvez consulter les onglets du menu pour le détail.";
}

export default function ChatDrawer({ open, onClose, role, me }) {
  const [name, setName] = useState(TONTINE.name);
  const [ctx, setCtx] = useState(null);

  const suggestions = role === "admin"
    ? ["Qui n'a pas encore versé ce mois ?", "Résume l'état de la caisse"]
    : ["Combien j'ai déjà versé ?", "Quand est mon prochain tour ?"];

  const [messages, setMessages] = useState([
    { from: "bot", text: role === "admin"
      ? "Bonjour. Je peux vous aider à suivre les cotisations de la tontine. Que voulez-vous savoir ?"
      : "Bonjour. Je peux répondre à vos questions sur votre tontine. Que voulez-vous savoir ?" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchTontineSettings().then((t) => setName(t.name)).catch(() => {});
    buildContext(role, me).then(setCtx).catch(() => setCtx(null));
  }, [open, role, me]);

  const send = async (text) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, role, context: ctx }),
      });
      if (!res.ok) throw new Error("API indisponible");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages((m) => [...m, { from: "bot", text: data.reply }]);
    } catch {
      setMessages((m) => [...m, { from: "bot", text: localFallback(text, ctx, role) }]);
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;
  return (
    <div style={{
      position: "fixed", bottom: 16, right: 16, left: 16, width: "auto", maxWidth: 340, marginLeft: "auto", maxHeight: "min(480px, 70vh)",
      background: "#fff", borderRadius: 16, border: `1px solid ${T.line}`,
      boxShadow: "0 16px 40px rgba(22,28,51,0.18)", display: "flex", flexDirection: "column",
      overflow: "hidden", zIndex: 50,
    }}>
      <div style={{ background: T.ink, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <Sparkles size={16} color={T.gold} style={{ flexShrink: 0 }} />
          <span className="f-body" style={{ color: "#fff", fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Assistant {name}
          </span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}>
          <X size={16} color="#C7CCE3" />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10, background: T.stone }}>
        {messages.map((m, i) => (
          <div key={i} className="f-body" style={{
            alignSelf: m.from === "user" ? "flex-end" : "flex-start",
            background: m.from === "user" ? T.ink : "#fff",
            color: m.from === "user" ? "#fff" : T.text,
            border: m.from === "user" ? "none" : `1px solid ${T.line}`,
            borderRadius: 12, padding: "8px 12px", fontSize: 13.5, maxWidth: "85%",
          }}>
            {m.text}
          </div>
        ))}
        {busy && <div style={{ fontSize: 12, color: T.textSoft }}>L'assistant réfléchit…</div>}
      </div>
      <div style={{ padding: 10, borderTop: `1px solid ${T.line}`, display: "flex", flexWrap: "wrap", gap: 6 }}>
        {suggestions.map((s) => (
          <button key={s} onClick={() => send(s)} className="f-body" style={{
            fontSize: 11.5, border: `1px solid ${T.line}`, background: "#fff", borderRadius: 999,
            padding: "5px 10px", cursor: "pointer", color: T.textSoft,
          }}>{s}</button>
        ))}
      </div>
      <div style={{ padding: 10, borderTop: `1px solid ${T.line}`, display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Posez votre question…"
          className="f-body"
          style={{ flex: 1, border: `1px solid ${T.line}`, borderRadius: 10, padding: "8px 10px", fontSize: 13, outline: "none" }}
        />
        <button onClick={() => send(input)} style={{
          background: T.ink, border: "none", borderRadius: 10, width: 36, display: "flex",
          alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <Send size={15} color={T.gold} />
        </button>
      </div>
    </div>
  );
}
