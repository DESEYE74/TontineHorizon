import React, { useEffect, useState } from "react";
import { Share2, Download, FileText, ChevronRight } from "lucide-react";
import { T } from "../theme.jsx";
import { Screen } from "./UI.jsx";
import { fetchReceipts } from "../data/api.js";
import { TONTINE } from "../data/mock.js";
import { downloadReceiptPdf, shareReceiptPdf } from "../lib/pdf.js";

function ReceiptPreview({ receipt }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${T.line}`, borderRadius: 14, padding: "26px 26px 22px", width: 340 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <p className="f-display" style={{ fontSize: 17, fontStyle: "italic", margin: 0, color: T.text }}>{TONTINE.name}</p>
          <p style={{ fontSize: 11, color: T.textSoft, margin: "2px 0 0" }}>Reçu de versement</p>
        </div>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: T.goldTint, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FileText size={15} color={T.gold} />
        </div>
      </div>
      <div className="f-mono" style={{ fontSize: 11, color: T.textSoft, marginBottom: 16 }}>{receipt.id}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
        {[["Membre", receipt.member], ["Tour", `Tour ${receipt.turn} / ${TONTINE.totalTurns}`], ["Date de versement", receipt.date]].map(([k, v]) => (
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

export default function ReceiptsView({ role, me }) {
  const [receipts, setReceipts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const all = await fetchReceipts();
      const list = role === "admin" ? all : all.filter((r) => r.member === me?.name);
      setReceipts(list);
      setSelected(list[0] ?? null);
      setLoading(false);
    })();
  }, [role, me]);

  if (loading) return <p style={{ color: T.textSoft, fontSize: 13.5 }}>Chargement…</p>;

  return (
    <Screen title={role === "admin" ? "Reçus et documents" : "Mes reçus"} subtitle="Générez un PDF et partagez-le directement sur WhatsApp.">
      {receipts.length === 0 ? (
        <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: 24, color: T.textSoft, fontSize: 13.5 }}>
          Aucun reçu pour le moment.
        </div>
      ) : (
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ flex: 1, background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: "14px 16px" }}>
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
                    <p className="f-mono" style={{ fontSize: 11, color: T.textSoft, margin: 0 }}>{r.id} · {r.date}</p>
                  </div>
                </div>
                <ChevronRight size={15} color={T.textSoft} />
              </button>
            ))}
          </div>

          {selected && (
            <div style={{ flex: "0 0 auto" }}>
              <ReceiptPreview receipt={selected} />
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button
                  disabled={busy}
                  onClick={async () => { setBusy(true); await shareReceiptPdf(selected); setBusy(false); }}
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
                  onClick={async () => { setBusy(true); await downloadReceiptPdf(selected); setBusy(false); }}
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
