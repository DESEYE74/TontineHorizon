import React, { useState } from "react";
import { X, Send, Sparkles } from "lucide-react";
import { T } from "../theme.jsx";

function localFallback(text) {
  const q = text.toLowerCase();
  if (q.includes("retard")) return "Oumar Sidibé n'a pas encore versé sa part de ce mois (25 000 FCFA).";
  if (q.includes("tour")) return "Votre prochain tour comme bénéficiaire est prévu au tour 11, soit dans 4 mois.";
  if (q.includes("versé")) return "Vous avez versé 6 parts sur 7, soit 150 000 FCFA au total.";
  return "Je note votre question. Une fois l'assistant connecté (voir api/chat.js), je répondrai à partir des données réelles de la tontine.";
}

export default function ChatDrawer({ open, onClose, role }) {
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

  const send = async (text) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, role }),
      });
      if (!res.ok) throw new Error("API indisponible");
      const data = await res.json();
      setMessages((m) => [...m, { from: "bot", text: data.reply }]);
    } catch {
      setMessages((m) => [...m, { from: "bot", text: localFallback(text) }]);
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, width: 340, maxHeight: 480,
      background: "#fff", borderRadius: 16, border: `1px solid ${T.line}`,
      boxShadow: "0 16px 40px rgba(22,28,51,0.18)", display: "flex", flexDirection: "column",
      overflow: "hidden", zIndex: 50,
    }}>
      <div style={{ background: T.ink, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={16} color={T.gold} />
          <span className="f-body" style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Assistant Jigi</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
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
