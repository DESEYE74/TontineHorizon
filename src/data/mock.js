export const TONTINE = {
  name: "Tontine",
  motto: "La solidarité d'aujourd'hui, la sécurité de demain",
  amount: 25000,
  currency: "FCFA",
  frequency: "Mensuelle",
  currentTurn: 7,
  totalTurns: 12,
  cycleNumber: 1,
};

export const MEMBERS = [
  { id: 1, name: "Awa Koné", initials: "AK", status: "paid", turn: 1, code: "482913" },
  { id: 2, name: "Moussa Diarra", initials: "MD", status: "paid", turn: 2, code: "119284" },
  { id: 3, name: "Fatou Cissé", initials: "FC", status: "paid", turn: 3, code: "550217" },
  { id: 4, name: "Ibrahim Touré", initials: "IT", status: "paid", turn: 4, code: "778391" },
  { id: 5, name: "Aïcha Sow", initials: "AS", status: "paid", turn: 5, code: "204958" },
  { id: 6, name: "Karim Bagayoko", initials: "KB", status: "paid", turn: 6, code: "635820" },
  { id: 7, name: "Salimata Traoré", initials: "ST", status: "current", turn: 7, code: "947162" },
  { id: 8, name: "Oumar Sidibé", initials: "OS", status: "late", turn: 8, code: "310475" },
  { id: 9, name: "Djénéba Coulibaly", initials: "DC", status: "upcoming", turn: 9, code: "826043" },
  { id: 10, name: "Boubacar Konaté", initials: "BK", status: "upcoming", turn: 10, code: "593718" },
  { id: 11, name: "Mariam Diallo", initials: "MD2", status: "upcoming", turn: 11, code: "471029" },
  { id: 12, name: "Adama Keïta", initials: "AK2", status: "upcoming", turn: 12, code: "268594" },
];

export const RECEIPTS = [
  { id: "R-2026-007-01", member: "Awa Koné", turn: 7, date: "03 juil. 2026", amount: TONTINE.amount },
  { id: "R-2026-007-02", member: "Moussa Diarra", turn: 7, date: "04 juil. 2026", amount: TONTINE.amount },
  { id: "R-2026-007-03", member: "Fatou Cissé", turn: 7, date: "05 juil. 2026", amount: TONTINE.amount },
  { id: "R-2026-007-06", member: "Karim Bagayoko", turn: 7, date: "06 juil. 2026", amount: TONTINE.amount },
];
