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

// jsPDF (police "helvetica" de base) ne sait pas afficher le caractère
// spécial utilisé par toLocaleString("fr-FR") comme séparateur de milliers
// (espace fine insécable) — il apparaît alors comme un caractère cassé sur
// certains téléphones. On formate donc nous-mêmes avec une espace normale.
function formatAmount(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

async function drawHeader(doc, pageWidth, name, subtitle) {
  try {
    const logoData = await loadImageAsDataURL(logoUrl);
    doc.addImage(logoData, "PNG", pageWidth / 2 - 12, 10, 24, 24);
  } catch {
    // Si le logo ne charge pas, on continue sans bloquer la génération du PDF.
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(22, 28, 51);
  doc.text(name, pageWidth / 2, 42, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 111, 128);
  doc.text(subtitle, pageWidth / 2, 48, { align: "center" });

  doc.setDrawColor(228, 225, 214);
  doc.line(15, 54, pageWidth - 15, 54);
}

function drawRows(doc, pageWidth, rows, startY) {
  let y = startY;
  doc.setFontSize(11);
  rows.forEach(([k, v]) => {
    doc.setTextColor(107, 111, 128);
    doc.text(k, 15, y);
    doc.setTextColor(27, 33, 48);
    doc.text(String(v), pageWidth - 15, y, { align: "right" });
    y += 9;
  });
  return y;
}

function drawAmount(doc, pageWidth, y, label, amount, currency) {
  doc.setDrawColor(228, 225, 214);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(15, y + 2, pageWidth - 15, y + 2);
  doc.setLineDashPattern([], 0);

  y += 14;
  doc.setFontSize(10);
  doc.setTextColor(107, 111, 128);
  doc.text(label, 15, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(27, 33, 48);
  doc.text(`${formatAmount(amount)} ${currency}`, pageWidth - 15, y, { align: "right" });
  return y;
}

// ---- Reçu de versement individuel (cotisation d'un membre) ------------------
// `context` permet de passer les vraies valeurs de la tontine (nom, devise,
// nombre de tours = nombre de membres). Sans contexte, on retombe sur les
// valeurs de démonstration.
export async function buildReceiptPdf(receipt, context = {}) {
  const name = context.name ?? TONTINE.name;
  const currency = context.currency ?? TONTINE.currency;
  const totalTurns = context.totalTurns ?? TONTINE.totalTurns;
  const reference = receipt.reference || receipt.id;

  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const pageWidth = doc.internal.pageSize.getWidth();

  await drawHeader(doc, pageWidth, name, "Reçu de versement");

  const y = drawRows(doc, pageWidth, [
    ["Référence", reference],
    ["Membre", receipt.member],
    ["Tour", `${receipt.turn} / ${totalTurns}`],
    ["Cycle", `${receipt.cycle ?? 1}`],
    ["Date de versement", receipt.date],
  ], 64);

  drawAmount(doc, pageWidth, y, "Montant versé", receipt.amount, currency);

  const fileName = `${reference}.pdf`;
  const blob = doc.output("blob");
  return { doc, blob, fileName };
}

export async function downloadReceiptPdf(receipt, context) {
  const { doc, fileName } = await buildReceiptPdf(receipt, context);
  doc.save(fileName);
}

// Partage natif (mobile : ouvre le menu de partage, WhatsApp inclus).
// Sur ordinateur, si le partage de fichier n'est pas supporté, on télécharge à la place.
export async function shareReceiptPdf(receipt, context) {
  const { blob, fileName } = await buildReceiptPdf(receipt, context);
  const file = new File([blob], fileName, { type: "application/pdf" });
  const name = context?.name ?? TONTINE.name;

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: `Reçu ${receipt.member} — ${name}`,
      text: `Reçu de versement, tour ${receipt.turn} — ${name}`,
    });
  } else {
    await downloadReceiptPdf(receipt, context);
  }
}

// ---- Reçu de remise de la caisse au bénéficiaire du tour ---------------------
// `payout` : { memberName, memberCode, turn, cycle, totalAmount, date }
export async function buildPayoutReceiptPdf(payout, context = {}) {
  const name = context.name ?? TONTINE.name;
  const currency = context.currency ?? TONTINE.currency;
  const totalTurns = context.totalTurns ?? TONTINE.totalTurns;
  const reference = `${payout.memberCode || "------"}T${payout.turn}C${payout.cycle ?? 1}R`;

  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const pageWidth = doc.internal.pageSize.getWidth();

  await drawHeader(doc, pageWidth, name, "Reçu de remise au bénéficiaire");

  const y = drawRows(doc, pageWidth, [
    ["Référence", reference],
    ["Bénéficiaire", payout.memberName],
    ["Tour", `${payout.turn} / ${totalTurns}`],
    ["Cycle", `${payout.cycle ?? 1}`],
    ["Date de remise", payout.date],
  ], 64);

  drawAmount(doc, pageWidth, y, "Montant total remis", payout.totalAmount, currency);

  const fileName = `${reference}.pdf`;
  const blob = doc.output("blob");
  return { doc, blob, fileName };
}

export async function downloadPayoutReceiptPdf(payout, context) {
  const { doc, fileName } = await buildPayoutReceiptPdf(payout, context);
  doc.save(fileName);
}

export async function sharePayoutReceiptPdf(payout, context) {
  const { blob, fileName } = await buildPayoutReceiptPdf(payout, context);
  const file = new File([blob], fileName, { type: "application/pdf" });
  const name = context?.name ?? TONTINE.name;

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: `Reçu de remise — ${payout.memberName} — ${name}`,
      text: `Remise de la caisse, tour ${payout.turn} — ${name}`,
    });
  } else {
    await downloadPayoutReceiptPdf(payout, context);
  }
}
