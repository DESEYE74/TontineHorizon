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
      html, body { margin: 0; max-width: 100%; overflow-x: hidden; }
      .f-display { font-family: 'Fraunces', serif; }
      .f-body { font-family: 'Inter', sans-serif; }
      .f-mono { font-family: 'IBM Plex Mono', monospace; }

      /* ---- Mise en page responsive (mobile) ---- */
      .app-shell { display: flex; min-height: 100vh; }
      .app-sidebar {
        width: 220px; flex-shrink: 0; position: sticky; top: 0; height: 100vh; overflow-y: auto;
      }
      .app-nav-list { display: flex; flex-direction: column; gap: 2px; }
      .app-main { flex: 1; min-width: 0; padding: 28px 32px; overflow-y: auto; }

      .two-col { display: flex; gap: 20px; align-items: flex-start; }
      .wheel-col { flex: 0 0 380px; max-width: 380px; }
      .list-col { flex: 1; min-width: 0; }

      .stat-row { display: flex; gap: 14px; margin-bottom: 24px; }

      /* ---- Listes défilantes (hauteur limitée + barre de défilement) ---- */
      .scroll-list { max-height: 420px; overflow-y: auto; padding-right: 4px; }
      .scroll-list::-webkit-scrollbar { width: 8px; }
      .scroll-list::-webkit-scrollbar-track { background: transparent; }
      .scroll-list::-webkit-scrollbar-thumb { background: #D8D4C6; border-radius: 8px; }
      .scroll-list::-webkit-scrollbar-thumb:hover { background: #C4BFAE; }
      .scroll-list { scrollbar-width: thin; scrollbar-color: #D8D4C6 transparent; }

      @media (max-width: 760px) {
        .scroll-list { max-height: 340px; }
      }

      @media (max-width: 900px) {
        .wheel-col { flex: 0 0 320px; max-width: 320px; }
      }

      @media (max-width: 760px) {
        .app-shell { flex-direction: column; }
        .app-sidebar {
          width: 100%; height: auto; position: relative; padding: 12px 14px !important;
        }
        .app-sidebar-header { padding-bottom: 10px !important; }
        .app-nav-list { flex-direction: row; overflow-x: auto; gap: 6px; padding-bottom: 4px; -webkit-overflow-scrolling: touch; }
        .app-nav-list button { white-space: nowrap; flex-shrink: 0; }
        .app-sidebar-footer { flex-direction: row !important; margin-top: 10px !important; gap: 8px !important; }
        .app-sidebar-footer button { flex: 1; justify-content: center !important; }
        .app-main { padding: 18px 16px; }

        .two-col { flex-direction: column; }
        .wheel-col { flex: 1 1 auto; max-width: 100%; width: 100%; }

        .stat-row { flex-direction: column; }
      }

      @media (max-width: 480px) {
        .rotation-wheel-wrap { transform: scale(0.82); transform-origin: top center; margin-bottom: -60px; }
      }
    `}</style>
  );
}
