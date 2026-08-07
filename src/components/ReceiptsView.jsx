import React, { useEffect, useState } from "react";
import { Share2, Download, FileText, ChevronRight, Gift } from "lucide-react";
import { T } from "../theme.jsx";
import { Screen } from "./UI.jsx";
import { fetchReceipts, fetchMembers, fetchTontineSettings } from "../data/api.js";
import { downloadReceiptPdf, shareReceiptPdf, downloadPayoutReceiptPdf, sharePayoutReceiptPdf } from "../lib/pdf.js";

function ReceiptPreview({ receipt, tontineName, totalTurns }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${T.line}`, borderRadius: 14, padding: "26px 26px 22px", width: "100%", maxWidth: 340 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <p className="f-display" style={{ fontSize: 17, fontStyle: "italic", margin: 0, color: T.text }}>{tontineName}</p>
          <p style={{ fontSize: 11, color: T.textSoft, margin: "2px 0 0" }}>Reçu de versement</p>
        </div>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: T.goldTint, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FileText size={15} color={T.gold} />
        </div>
      </div>
      <div className="f-mono" style={{ fontSize: 11, color: T.textSoft, marginBottom: 16 }}>{receipt.reference || receipt.id}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
        {[["Membre", receipt.member], ["Tour", `Tour ${receipt.turn} / ${totalTurns}`], ["Cycle", receipt.cycle ?? 1], ["Date de versement", receipt.date]].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: T.textSoft }}>{k}</span>
            <span style={{ fontWeight: 600, color: T.text }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: `1px dashed ${T.line}`, paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 12.5, color: T.textSoft }}>Montant versé</span>
        <span className="f-mono" style={{ fontSize: 20, fontWeight: 600, color: T.text }}>{receipt.amount.toLocaleString("fr-FR")} F</span>
      </div>
    </div>
  );
}

function PayoutPreview({ payout, tontineName, totalTurns, currency }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${T.line}`, borderRadius: 14, padding: "26px 26px 22px", width: "100%", maxWidth: 340 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <p className="f-display" style={{ fontSize: 17, fontStyle: "italic", margin: 0, color: T.text }}>{tontineName}</p>
          <p style={{ fontSize: 11, color: T.textSoft, margin: "2px 0 0" }}>Reçu de remise au bénéficiaire</p>
        </div>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: T.goldTint, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Gift size={15} color={T.gold} />
        </div>
      </div>
      <div className="f-mono" style={{ fontSize: 11, color: T.textSoft, marginBottom: 16 }}>
        {payout.memberCode || "------"}T{payout.turn}C{payout.cycle}R
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
        {[["Bénéficiaire", payout.memberName], ["Tour", `Tour ${payout.turn} / ${totalTurns}`], ["Cycle", payout.cycle], ["Date de remise", payout.date]].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: T.textSoft }}>{k}</span>
            <span style={{ fontWeight: 600, color: T.text }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: `1px dashed ${T.line}`, paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 12.5, color: T.textSoft }}>Montant total remis</span>
        <span className="f-mono" style={{ fontSize: 20, fontWeight: 600, color: T.text }}>{payout.totalAmount.toLocaleString("fr-FR")} {currency}</span>
      </div>
    </div>
  );
}

export default function ReceiptsView({ role, me }) {
  const [docType, setDocType] = useState("payment"); // payment | payout
  const [receipts, setReceipts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [context, setContext] = useState({ name: "Tontine", currency: "FCFA", totalTurns: 12 });
  const [payout, setPayout] = useState(null); // infos du bénéficiaire du tour en cours

  useEffect(() => {
    (async () => {
      const [all, members, tontine] = await Promise.all([fetchReceipts(), fetchMembers(), fetchTontineSettings()]);
      const list = role === "admin" ? all : all.filter((r) => r.member === me?.name);
      setReceipts(list);
      setSelected(list[0] ?? null);
      setContext({ name: tontine.name, currency: tontine.currency, totalTurns: members.length });

      const currentTurn = tontine.currentTurn ?? 1;
      const beneficiary = members.find((m) => m.turn === currentTurn);
      if (beneficiary) {
        setPayout({
          memberName: beneficiary.name,
          memberCode: beneficiary.code || beneficiary.personal_code || "",
          turn: currentTurn,
          cycle: tontine.cycleNumber ?? 1,
          totalAmount: tontine.amount * members.length,
          date: new Date().toLocaleDateString("fr-FR"),
        });
      }
      setLoading(false);
    })();
  }, [role, me]);

  if (loading) return <p style={{ color: T.textSoft, fontSize: 13.5 }}>Chargement…</p>;

  const iAmBeneficiary = role === "member" && payout && me?.name === payout.memberName;
  const canSeePayout = role === "admin" || iAmBeneficiary;

  return (
    <Screen title={role === "admin" ? "Reçus et documents" : "Mes reçus"} subtitle="Générez un PDF et partagez-le directement sur WhatsApp.">
      {canSeePayout && (
        <div style={{ display: "flex", background: T.stone, borderRadius: 12, padding: 4, marginBottom: 20, maxWidth: 360 }}>
          {[
            { key: "payment", label: "Reçus de versement" },
            { key: "payout", label: "Reçu de remise" },
          ].map((t) => (
            <button key={t.key} onClick={() => setDocType(t.key)} style={{
              flex: 1, padding: "8px 0", borderRadius: 9, border: "none", cursor: "pointer",
              background: docType === t.key ? T.ink : "transparent",
              color: docType === t.key ? "#fff" : T.textSoft, fontWeight: 600, fontSize: 12.5,
            }}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {docType === "payout" && canSeePayout ? (
        payout ? (
          <div className="two-col">
            <div className="wheel-col" style={{ flex: "0 0 auto", background: "none", padding: 0 }}>
              <PayoutPreview payout={payout} tontineName={context.name} totalTurns={context.totalTurns} currency={context.currency} />
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button
                  disabled={busy}
                  onClick={async () => { setBusy(true); await sharePayoutReceiptPdf(payout, context); setBusy(false); }}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    background: "#25D366", border: "none", borderRadius: 10, padding: "11px 0",
                    color: "#0B3B1E", fontWeight: 700, fontSize: 13, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1,
                  }}
                >
                  <Share2 size={15} /> Partager sur WhatsApp
                </button>
                <button
                  disabled={busy}
                  onClick={async () => { setBusy(true); await downloadPayoutReceiptPdf(payout, context); setBusy(false); }}
                  style={{ width: 44, display: "flex", alignItems: "center", justifyContent: "center", background: T.ink, border: "none", borderRadius: 10, cursor: "pointer" }}
                >
                  <Download size={16} color={T.gold} />
                </button>
              </div>
              <p style={{ fontSize: 11, color: T.textSoft, marginTop: 8, textAlign: "center" }}>
                Document attestant la remise de la caisse complète au bénéficiaire de ce tour.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: 24, color: T.textSoft, fontSize: 13.5 }}>
            Aucun bénéficiaire identifié pour le tour en cours.
          </div>
        )
      ) : receipts.length === 0 ? (
        <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: 24, color: T.textSoft, fontSize: 13.5 }}>
          Aucun reçu pour le moment.
        </div>
      ) : (
        <div className="two-col">
          <div className="list-col" style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: "14px 16px" }}>
            <div className="scroll-list">
              {receipts.map((r) => (
                <button key={r.id} onClick={() => setSelected(r)} style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 8px", borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left",
                  background: selected?.id === r.id ? T.stone : "transparent", marginBottom: 2,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <FileText size={15} color={T.textSoft} />
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 600, margin: 0, color: T.text }}>{r.member}</p>
                      <p className="f-mono" style={{ fontSize: 11, color: T.textSoft, margin: 0 }}>{r.reference || r.id} · {r.date}</p>
                    </div>
                  </div>
                  <ChevronRight size={15} color={T.textSoft} />
                </button>
              ))}
            </div>
          </div>

          {selected && (
            <div className="wheel-col" style={{ flex: "0 0 auto", background: "none", padding: 0 }}>
              <ReceiptPreview receipt={selected} tontineName={context.name} totalTurns={context.totalTurns} />
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button
                  disabled={busy}
                  onClick={async () => { setBusy(true); await shareReceiptPdf(selected, context); setBusy(false); }}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    background: "#25D366", border: "none", borderRadius: 10, padding: "11px 0",
                    color: "#0B3B1E", fontWeight: 700, fontSize: 13, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1,
                  }}
                >
                  <Share2 size={15} /> Partager sur WhatsApp
                </button>
                <button
                  disabled={busy}
                  onClick={async () => { setBusy(true); await downloadReceiptPdf(selected, context); setBusy(false); }}
                  style={{ width: 44, display: "flex", alignItems: "center", justifyContent: "center", background: T.ink, border: "none", borderRadius: 10, cursor: "pointer" }}
                >
                  <Download size={16} color={T.gold} />
                </button>
              </div>
              <p style={{ fontSize: 11, color: T.textSoft, marginTop: 8, textAlign: "center" }}>
                Sur mobile, "Partager" ouvre directement WhatsApp avec le PDF prêt à envoyer.
              </p>
            </div>
          )}
        </div>
      )}
    </Screen>
  );
}
