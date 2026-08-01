import React, { useEffect, useState } from "react";
import { Wallet, KeyRound } from "lucide-react";
import { T } from "../theme.jsx";
import { TONTINE } from "../data/mock.js";
import { loginAdmin, loginMember, fetchTontineSettings } from "../data/api.js";
import logoUrl from "../assets/logo.png";
import { isDemoMode } from "../supabaseClient.js";

const inputStyle = {
  width: "100%", background: "#161C33", border: "1px solid #33406B", borderRadius: 9,
  padding: "9px 12px", color: "#fff", fontSize: 13.5, margin: "6px 0 16px", outline: "none", boxSizing: "border-box",
};

export default function Login({ onEnter }) {
  const [mode, setMode] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState(TONTINE);

  useEffect(() => {
    fetchTontineSettings().then(setBrand).catch(() => {});
  }, []);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "admin") {
        const user = await loginAdmin(email, password);
        onEnter("admin", user);
      } else {
        const member = await loginMember(code);
        onEnter("member", member);
      }
    } catch (e) {
      setError(e.message || "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="f-body" style={{ minHeight: "100vh", background: T.ink, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src={logoUrl} alt={brand.name} style={{ width: 84, height: 84, objectFit: "contain", margin: "0 auto 12px" }} />
          <h1 className="f-display" style={{ color: "#fff", fontSize: 26, margin: 0, fontStyle: "italic", fontWeight: 500 }}>
            {brand.name}
          </h1>
          <p style={{ color: "#8B93B8", fontSize: 13, margin: "6px 0 0" }}>{brand.motto}</p>
        </div>

        <div style={{ display: "flex", background: "#212B4C", borderRadius: 12, padding: 4, marginBottom: 20 }}>
          {["admin", "member"].map((m) => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
              flex: 1, padding: "9px 0", borderRadius: 9, border: "none", cursor: "pointer",
              background: mode === m ? T.gold : "transparent",
              color: mode === m ? "#2A2205" : "#8B93B8", fontWeight: 600, fontSize: 13,
            }}>
              {m === "admin" ? "Administrateur" : "Membre"}
            </button>
          ))}
        </div>

        <div style={{ background: "#212B4C", borderRadius: 14, padding: 22, border: "1px solid #33406B" }}>
          {mode === "admin" ? (
            <>
              <label style={{ fontSize: 12.5, color: "#8B93B8" }}>Identifiant</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@tontine-jigi.com" style={inputStyle} />
              <label style={{ fontSize: 12.5, color: "#8B93B8" }}>Mot de passe</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" style={inputStyle} />
            </>
          ) : (
            <>
              <label style={{ fontSize: 12.5, color: "#8B93B8", display: "flex", alignItems: "center", gap: 6 }}>
                <KeyRound size={13} /> Code personnel à 6 chiffres
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="ex. 482913"
                maxLength={6}
                className="f-mono"
                style={{ ...inputStyle, letterSpacing: 4, fontSize: 18, textAlign: "center" }}
              />
              <p style={{ fontSize: 11.5, color: "#6B7397", marginTop: -6 }}>Code oublié ? Contactez l'administrateur de la tontine.</p>
            </>
          )}

          {error && <p style={{ color: "#E88", fontSize: 12.5, marginTop: -6, marginBottom: 12 }}>{error}</p>}

          <button onClick={submit} disabled={loading} style={{
            width: "100%", background: T.gold, border: "none", borderRadius: 10, padding: "11px 0",
            fontWeight: 700, fontSize: 14, color: "#2A2205", cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1, marginTop: 6,
          }}>
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </div>

        {isDemoMode && (
          <p style={{ textAlign: "center", fontSize: 11.5, color: "#6B7397", marginTop: 16 }}>
            Mode démo (Supabase non configuré) — code test : <span className="f-mono">947162</span>
          </p>
        )}
      </div>
    </div>
  );
}
