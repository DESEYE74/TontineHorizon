import { jsPDF } from "jspdf";
import logoUrl from "../assets/logo.png";
import { TONTINE } from "../data/mock.js";

async function loadImageAsDataURL(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Construit le PDF du reçu et retourne { doc, blob, fileName }
export async function buildReceiptPdf(receipt) {
  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const pageWidth = doc.internal.pageSize.getWidth();

  try {
    const logoData = await loadImageAsDataURL(logoUrl);
    doc.addImage(logoData, "PNG", pageWidth / 2 - 12, 10, 24, 24);
  } catch {
    // Si le logo ne charge pas, on continue sans bloquer la génération du PDF.
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(22, 28, 51);
  doc.text(TONTINE.name, pageWidth / 2, 42, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 111, 128);
  doc.text("Reçu de versement", pageWidth / 2, 48, { align: "center" });

  doc.setDrawColor(228, 225, 214);
  doc.line(15, 54, pageWidth - 15, 54);

  const rows = [
    ["Référence", receipt.id],
    ["Membre", receipt.member],
    ["Tour", `${receipt.turn} / ${TONTINE.totalTurns}`],
    ["Date de versement", receipt.date],
  ];
  let y = 64;
  doc.setFontSize(11);
  rows.forEach(([k, v]) => {
    doc.setTextColor(107, 111, 128);
    doc.text(k, 15, y);
    doc.setTextColor(27, 33, 48);
    doc.text(String(v), pageWidth - 15, y, { align: "right" });
    y += 9;
  });

  doc.setDrawColor(228, 225, 214);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(15, y + 2, pageWidth - 15, y + 2);
  doc.setLineDashPattern([], 0);

  y += 14;
  doc.setFontSize(10);
  doc.setTextColor(107, 111, 128);
  doc.text("Montant versé", 15, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(27, 33, 48);
  doc.text(`${receipt.amount.toLocaleString("fr-FR")} ${TONTINE.currency}`, pageWidth - 15, y, { align: "right" });

  const fileName = `${receipt.id}.pdf`;
  const blob = doc.output("blob");
  return { doc, blob, fileName };
}

export async function downloadReceiptPdf(receipt) {
  const { doc, fileName } = await buildReceiptPdf(receipt);
  doc.save(fileName);
}

// Partage natif (mobile : ouvre le menu de partage, WhatsApp inclus).
// Sur ordinateur, si le partage de fichier n'est pas supporté, on télécharge à la place.
export async function shareReceiptPdf(receipt) {
  const { blob, fileName } = await buildReceiptPdf(receipt);
  const file = new File([blob], fileName, { type: "application/pdf" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: `Reçu ${receipt.member} — ${TONTINE.name}`,
      text: `Reçu de versement, tour ${receipt.turn} — ${TONTINE.name}`,
    });
  } else {
    await downloadReceiptPdf(receipt);
  }
}
