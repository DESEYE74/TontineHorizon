// Statut de rotation d'un membre : où en est-il dans l'ordre des tours,
// par rapport au tour actuellement en cours.
export function rotationStatus(turn, currentTurn) {
  if (turn < currentTurn) return "received";
  if (turn === currentTurn) return "current";
  return "upcoming";
}

// Statut de paiement d'un membre pour le tour en cours : a-t-il un
// versement enregistré pour ce tour ?
export function paymentStatus(memberId, currentTurn, payments) {
  const hasPaid = payments.some((p) => p.member_id === memberId && p.turn === currentTurn);
  return hasPaid ? "paid" : "late";
}

// Calcule le prochain tour / cycle lorsqu'on clôture le tour en cours.
// Une fois le dernier tour atteint, on reboucle au tour 1 en incrémentant
// le compteur de cycle (2ème tour complet, 3ème, etc.).
export function nextTurn({ currentTurn, totalTurns, cycleNumber }) {
  if (currentTurn >= totalTurns) {
    return { currentTurn: 1, cycleNumber: (cycleNumber ?? 1) + 1 };
  }
  return { currentTurn: currentTurn + 1, cycleNumber: cycleNumber ?? 1 };
}
