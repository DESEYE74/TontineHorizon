export const T = {
  ink: "#161C33",
  inkPanel: "#212B4C",
  inkLine: "#33406B",
  gold: "#C9A227",
  goldSoft: "#E8CE7A",
  goldTint: "#3A331B",
  stone: "#EEEBE2",
  card: "#FFFFFF",
  text: "#1B2130",
  textSoft: "#6B6F80",
  line: "#E4E1D6",
  green: "#2F6B4F",
  greenTint: "#E4EFE8",
  rust: "#B5482F",
  rustTint: "#F7E6E1",
};

// Statut de ROTATION : où en est ce membre dans l'ordre des tours,
// calculé en comparant son numéro de tour au tour en cours (jamais stocké).
export const ROTATION_META = {
  received: { label: "Reçu", color: T.green, tint: T.greenTint },
  current: { label: "Bénéficiaire du tour", color: T.gold, tint: "#F7EFD8" },
  upcoming: { label: "À venir", color: T.textSoft, tint: "#F2F0E8" },
};

// Statut de PAIEMENT : ce membre a-t-il versé sa cotisation pour le tour en
// cours (calculé à partir des versements enregistrés, jamais stocké non plus).
export const PAYMENT_META = {
  paid: { label: "Payé", color: T.green, tint: T.greenTint },
  late: { label: "En retard", color: T.rust, tint: T.rustTint },
};

// Conservé pour compatibilité : usages génériques qui veulent les deux jeux réunis.
export const STATUS_META = { ...ROTATION_META, ...PAYMENT_META };

export function GlobalFonts() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; }
      .f-display { font-family: 'Fraunces', serif; }
      .f-body { font-family: 'Inter', sans-serif; }
      .f-mono { font-family: 'IBM Plex Mono', monospace; }
    `}</style>
  );
}
