import React, { useEffect, useState } from "react";
import { Wallet, AlertTriangle, ShieldCheck } from "lucide-react";
import { T } from "../theme.jsx";
import { RotationWheel, Pill, StatCard, Screen } from "./UI.jsx";
import { fetchMembers, fetchTontineSettings, fetchPaymentsForTurn } from "../data/api.js";
import { rotationStatus, paymentStatus } from "../lib/rotation.js";

export default function AdminDashboard() {
  const [members, setMembers] = useState([]);
  const [tontine, setTontine] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [m, t] = await Promise.all([fetchMembers(), fetchTontineSettings()]);
        const p = await fetchPaymentsForTurn(t.currentTurn ?? 1);
        setMembers(m);
        setTontine(t);
        setPayments(p);
      } catch (e) {
        setError(e.message || "Impossible de charger les données.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p style={{ color: T.textSoft, fontSize: 13.5 }}>Chargement…</p>;
  if (error) return <p style={{ color: T.rust, fontSize: 13.5 }}>{error}</p>;
  if (!tontine) return null;

  const currentTurn = tontine.currentTurn ?? 1;
  const paidCount = members.filter((m) => paymentStatus(m.id, currentTurn, payments) === "paid").length;
  const lateCount = members.length - paidCount;
  const beneficiary = members.find((m) => m.turn === currentTurn);
  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <Screen
      title="Tableau de bord"
      subtitle={`${tontine.frequency} · Cycle ${tontine.cycleNumber ?? 1} · Tour ${currentTurn} sur ${members.length}`}
    >
      <div className="stat-row">
        <StatCard label="Collecté ce tour" value={`${totalCollected.toLocaleString("fr-FR")} F`} sub={`${paidCount} / ${members.length} membres`} icon={Wallet} />
        <StatCard label="En retard" value={lateCount} sub="N'ont pas encore versé ce tour" icon={AlertTriangle} />
        <StatCard label="Bénéficiaire du tour" value={beneficiary?.name ?? "—"} sub={`Reçoit ${(tontine.amount * members.length).toLocaleString("fr-FR")} F`} icon={ShieldCheck} />
      </div>

      <div className="two-col">
        <div className="wheel-col" style={{ background: T.ink, borderRadius: 16, padding: "28px 20px" }}>
          <div className="rotation-wheel-wrap">
            <RotationWheel members={members} currentTurn={currentTurn} amount={tontine.amount} currency={tontine.currency} />
          </div>
        </div>
        <div className="list-col" style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: "18px 20px" }}>
          <h3 className="f-body" style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Ordre des tours</h3>
          <p style={{ fontSize: 12, color: T.textSoft, margin: "0 0 14px" }}>
            Qui a déjà reçu la caisse, qui la reçoit ce tour-ci, qui attend encore son tour.
          </p>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {members.map((m) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.line}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: T.stone, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: T.text }}>
                    {m.initials}
                  </div>
                  <span style={{ fontSize: 13.5 }}>Tour {m.turn} — {m.name}</span>
                </div>
                <Pill status={rotationStatus(m.turn, currentTurn)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Screen>
  );
}
