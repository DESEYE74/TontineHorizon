import React, { useEffect, useState } from "react";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { T } from "../theme.jsx";
import { countOutbox } from "../lib/offlineDb.js";

export default function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [pending, setPending] = useState(0);
  const [justSynced, setJustSynced] = useState(false);

  useEffect(() => {
    const refreshPending = () => countOutbox().then(setPending);
    refreshPending();
    const interval = setInterval(refreshPending, 4000);

    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    const onSynced = () => {
      setJustSynced(true);
      refreshPending();
      setTimeout(() => setJustSynced(false), 3000);
    };
    window.addEventListener("tontine-synced", onSynced);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("tontine-synced", onSynced);
    };
  }, []);

  if (online && pending === 0 && !justSynced) return null;

  const bg = !online ? "#3A2A1B" : justSynced ? T.greenTint : "#3A331B";
  const color = !online ? "#E8CE7A" : justSynced ? T.green : T.gold;

  return (
    <div className="f-body" style={{
      background: bg, color, fontSize: 12.5, fontWeight: 600, padding: "8px 16px",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textAlign: "center",
    }}>
      {!online ? (
        <>
          <WifiOff size={14} />
          Hors connexion — vos actions sont enregistrées et seront envoyées automatiquement au retour du réseau
          {pending > 0 && ` (${pending} en attente)`}
        </>
      ) : justSynced ? (
        <>
          <CheckCircle2 size={14} /> Synchronisation terminée
        </>
      ) : (
        <>
          <RefreshCw size={14} /> Connexion rétablie — synchronisation de {pending} action(s) en cours…
        </>
      )}
    </div>
  );
}
