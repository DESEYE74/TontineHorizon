import React, { useEffect, useState } from "react";
import { CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { T } from "../theme.jsx";
import { RotationWheel, Pill, StatCard, Screen } from "./UI.jsx";
import { fetchMembers, fetchTontineSettings, fetchPaymentsForTurn } from "../data/api.js";
import { rotationStatus, paymentStatus } from "../lib/rotation.js";

export default function MemberDashboard({ me }) {
  const [members, setMembers] = useState([]);
  const [tontine, setTontine] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [m, t] = await Promise.all([fetchMembers(), fetchTontineSettings()]);
      const p = await fetchPaymentsForTurn(t.currentTurn ?? 1);
      setMembers(m);
      setTontine(t);
      setPayments(p);
      setLoading(false);
    })();
  }, []);

  if (loading || !tontine) {
    return <p style={{ color: T.textSoft, fontSize: 13.5 }}>Chargement…</p>;
  }

  const currentTurn = tontine.currentTurn ?? 1;
  const self = members.find((m) => m.id === me?.id) ?? members[0];
  const myRotation = self ? rotationStatus(self.turn, currentTurn) : "upcoming";
  const myPayment = self ? paymentStatus(self.id, currentTurn, payments) : "late";
  const turnsUntilMine = self ? (self.turn - currentTurn + members.length) % members.length : 0;

  return (
    <Screen title="Ma situation" subtitle="Consultation seule — les modifications sont faites par l'administrateur.">
      <div className="stat-row">
        <StatCard
          label="Ma cotisation ce tour"
          value={myPayment === "paid" ? "Payée" : "En attente"}
          sub={`Tour ${self?.turn ?? "—"} sur ${members.length}`}
          icon={myPayment === "paid" ? CheckCircle2 : ShieldCheck}
        />
        <StatCard
          label="Mon prochain tour comme bénéficiaire"
          value={myRotation === "current" ? "C'est ce tour-ci" : `dans ${turnsUntilMine} tour(s)`}
          sub={myRotation === "received" ? "Vous avez déjà reçu ce cycle" : ""}
          icon={Clock}
        />
        <StatCard label="Montant de la part" value={`${tontine.amount.toLocaleString("fr-FR")} F`} sub={tontine.frequency} icon={ShieldCheck} />
      </div>

      <div className="two-col">
        <div className="wheel-col" style={{ background: T.ink, borderRadius: 16, padding: "28px 20px" }}>
          <div className="rotation-wheel-wrap">
            <RotationWheel members={members} currentTurn={currentTurn} amount={tontine.amount} currency={tontine.currency} />
          </div>
        </div>
        <div className="list-col" style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: "18px 20px" }}>
          <h3 className="f-body" style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>Ordre des tours du groupe</h3>
          <div className="scroll-list">
            {members.map((m) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.line}` }}>
                <span style={{ fontSize: 13.5, fontWeight: m.id === self?.id ? 700 : 400 }}>
                  Tour {m.turn} — {m.name}{m.id === self?.id ? " (vous)" : ""}
                </span>
                <Pill status={rotationStatus(m.turn, currentTurn)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Screen>
  );
}
