import React, { useEffect, useState } from "react";
import { ArrowRightCircle } from "lucide-react";
import { T } from "../theme.jsx";
import { Screen, Pill, RotationWheel } from "./UI.jsx";
import { fetchMembers, fetchTontineSettings, advanceTurn } from "../data/api.js";
import { rotationStatus } from "../lib/rotation.js";

export default function CalendarView({ role }) {
  const [members, setMembers] = useState([]);
  const [tontine, setTontine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [advancing, setAdvancing] = useState(false);

  const load = async () => {
    try {
      const [m, t] = await Promise.all([fetchMembers(), fetchTontineSettings()]);
      setMembers(m);
      setTontine(t);
    } catch (e) {
      setError(e.message || "Impossible de charger le calendrier.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <p style={{ color: T.textSoft, fontSize: 13.5 }}>Chargement…</p>;
  if (error) return <p style={{ color: T.rust, fontSize: 13.5 }}>{error}</p>;
  if (!tontine) return null;

  const currentTurn = tontine.currentTurn ?? 1;
  const totalTurns = tontine.totalTurns ?? members.length;
  const isLastTurn = currentTurn >= totalTurns;

  const handleAdvance = async () => {
    setAdvancing(true);
    await advanceTurn(tontine);
    setAdvancing(false);
    load();
  };

  return (
    <Screen
      title="Calendrier"
      subtitle={`Ordre de rotation — ${tontine.frequency}, cycle ${tontine.cycleNumber ?? 1}, tour ${currentTurn} sur ${totalTurns}`}
      action={role === "admin" && (
        <button onClick={handleAdvance} disabled={advancing} style={{
          display: "flex", alignItems: "center", gap: 7, background: T.ink, color: "#fff", border: "none",
          borderRadius: 10, padding: "10px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", opacity: advancing ? 0.7 : 1,
        }}>
          <ArrowRightCircle size={16} />
          {advancing ? "En cours…" : isLastTurn ? "Clôturer et recommencer un tour" : "Passer au tour suivant"}
        </button>
      )}
    >
      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ background: T.ink, borderRadius: 16, padding: "28px 20px", flex: "0 0 380px" }}>
          <RotationWheel members={members} currentTurn={currentTurn} amount={tontine.amount} currency={tontine.currency} />
        </div>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: "18px 20px" }}>
          <h3 className="f-body" style={{ fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>Ordre des tours</h3>
          {members.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.line}` }}>
              <span style={{ fontSize: 13.5 }}>Tour {m.turn} — {m.name}</span>
              <Pill status={rotationStatus(m.turn, currentTurn)} />
            </div>
          ))}
          {role === "admin" && (
            <p style={{ fontSize: 11.5, color: T.textSoft, marginTop: 14 }}>
              {isLastTurn
                ? "Tous les membres ont eu leur tour pour ce cycle. Cliquez ci-dessus pour repartir au tour 1 (nouveau cycle)."
                : "Une fois les cotisations de ce tour collectées et remises au bénéficiaire, cliquez ci-dessus pour avancer au tour suivant."}
            </p>
          )}
        </div>
      </div>
    </Screen>
  );
}
