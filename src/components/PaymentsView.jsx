import React, { useEffect, useState } from "react";
import { Plus, FileText, Save, Wallet } from "lucide-react";
import { T } from "../theme.jsx";
import { Screen, Pill } from "./UI.jsx";
import { fetchMembers, fetchTontineSettings, updateTontineSettings, fetchReceipts, fetchPaymentsForTurn, recordPayment } from "../data/api.js";
import { paymentStatus } from "../lib/rotation.js";

export default function PaymentsView() {
  const [members, setMembers] = useState([]);
  const [tontine, setTontine] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [amountDraft, setAmountDraft] = useState("");
  const [savingAmount, setSavingAmount] = useState(false);
  const [amountSaved, setAmountSaved] = useState(false);

  const [selectedMember, setSelectedMember] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [m, t, r] = await Promise.all([fetchMembers(), fetchTontineSettings(), fetchReceipts()]);
      const p = await fetchPaymentsForTurn(t.currentTurn ?? 1);
      setMembers(m);
      setTontine(t);
      setReceipts(r);
      setPayments(p);
      setAmountDraft(String(t.amount));
      setAmount(String(t.amount));
    } catch (e) {
      setError(e.message || "Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <p style={{ color: T.textSoft, fontSize: 13.5 }}>Chargement…</p>;
  if (!tontine) return error ? <p style={{ color: T.rust, fontSize: 13.5 }}>{error}</p> : null;

  const currentTurn = tontine.currentTurn ?? 1;

  const saveAmount = async () => {
    const value = Number(amountDraft);
    if (!value || value <= 0) return;
    setSavingAmount(true);
    await updateTontineSettings({ amount: value });
    setSavingAmount(false);
    setAmountSaved(true);
    setAmount(String(value));
    setTimeout(() => setAmountSaved(false), 2000);
    load();
  };

  const submit = async () => {
    if (!selectedMember || !amount) return;
    setSaving(true);
    setError("");
    try {
      const member = members.find((m) => String(m.id) === String(selectedMember));
      await recordPayment({ memberId: member.id, turn: currentTurn, amount: Number(amount), memberName: member.name });
      setSelectedMember("");
      setAmount(String(tontine.amount));
      load();
    } catch (e) {
      setError(e.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title="Versements" subtitle="Enregistrez un versement reçu, et ajustez le montant de la cotisation.">
      {/* Montant de la cotisation */}
      <div style={{ background: "#fff", border: `1px solid ${T.line}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <h3 className="f-body" style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <Wallet size={16} color={T.textSoft} /> Montant de la cotisation
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <input
            type="number"
            value={amountDraft}
            onChange={(e) => setAmountDraft(e.target.value)}
            className="f-mono"
            style={{ width: 160, padding: "9px 10px", borderRadius: 9, border: `1px solid ${T.line}`, fontSize: 14, boxSizing: "border-box" }}
          />
          <span style={{ fontSize: 13, color: T.textSoft }}>{tontine.currency} / {(tontine.frequency || "").toLowerCase()}</span>
          <button onClick={saveAmount} disabled={savingAmount} style={{
            display: "flex", alignItems: "center", gap: 6, background: T.ink, color: "#fff", border: "none",
            borderRadius: 9, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: savingAmount ? 0.7 : 1,
          }}>
            <Save size={14} /> {savingAmount ? "Enregistrement…" : "Enregistrer"}
          </button>
          {amountSaved && <span style={{ fontSize: 12.5, color: T.green }}>Montant mis à jour ✓</span>}
        </div>
      </div>

      {/* Enregistrer un versement */}
      <div style={{ background: "#fff", border: `1px solid ${T.line}`, borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <h3 className="f-body" style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <Plus size={16} color={T.textSoft} /> Enregistrer un versement — tour {currentTurn}
        </h3>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label style={{ fontSize: 12, color: T.textSoft }}>Membre</label>
            <select value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)} style={{
              width: "100%", marginTop: 4, padding: "9px 10px", borderRadius: 9, border: `1px solid ${T.line}`, fontSize: 13.5,
            }}>
              <option value="">Choisir un membre…</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ fontSize: 12, color: T.textSoft }}>Montant (FCFA)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="f-mono"
              style={{ width: "100%", marginTop: 4, padding: "9px 10px", borderRadius: 9, border: `1px solid ${T.line}`, fontSize: 13.5, boxSizing: "border-box" }}
            />
          </div>
          <button onClick={submit} disabled={!selectedMember || !amount || saving} style={{
            background: T.gold, border: "none", borderRadius: 9, padding: "10px 18px", fontWeight: 700,
            fontSize: 13, color: "#2A2205", cursor: "pointer", opacity: !selectedMember || !amount || saving ? 0.6 : 1,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Plus size={15} /> {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
        {error && <p style={{ color: T.rust, fontSize: 12.5, marginTop: 10 }}>{error}</p>}
      </div>

      {/* État des cotisations pour ce tour */}
      <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: "8px 20px", marginBottom: 24 }}>
        <h3 className="f-body" style={{ fontSize: 14, fontWeight: 700, margin: "14px 0" }}>État des cotisations — tour {currentTurn}</h3>
        <div className="scroll-list">
          {members.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.line}` }}>
              <span style={{ fontSize: 13.5 }}>{m.name}</span>
              <Pill status={paymentStatus(m.id, currentTurn, payments)} variant="payment" />
            </div>
          ))}
        </div>
      </div>

      <h3 className="f-body" style={{ fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>Historique des versements</h3>
      <div className="scroll-list" style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: "8px 20px" }}>
        {receipts.length === 0 ? (
          <p style={{ color: T.textSoft, fontSize: 13.5, padding: "16px 0" }}>Aucun versement enregistré pour le moment.</p>
        ) : receipts.map((r) => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${T.line}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FileText size={15} color={T.textSoft} />
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 600, margin: 0, color: T.text }}>{r.member}</p>
                <p className="f-mono" style={{ fontSize: 11, color: T.textSoft, margin: 0 }}>Tour {r.turn} · {r.date}</p>
              </div>
            </div>
            <span className="f-mono" style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>{r.amount.toLocaleString("fr-FR")} F</span>
          </div>
        ))}
      </div>
    </Screen>
  );
}
