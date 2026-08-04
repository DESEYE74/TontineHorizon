import React, { useEffect, useState } from "react";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { T } from "../theme.jsx";
import { countOutbox } from "../lib/offlineDb.js";
import { flushOutbox } from "../lib/sync.js";

export default function OfflineBadge() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
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
      setSyncing(false);
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

  const syncNow = async () => {
    setSyncing(true);
    const done = await flushOutbox();
    setSyncing(false);
    if (done > 0) {
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 3000);
    }
    countOutbox().then(setPending);
  };

  if (online && pending === 0 && !justSynced) return null;

  let bg, color, icon, text;
  if (!online) {
    bg = "#3A2A1B"; color = "#E8CE7A"; icon = <WifiOff size={14} />;
    text = `Hors connexion${pending > 0 ? ` — ${pending} en attente` : ""}`;
  } else if (justSynced) {
    bg = T.greenTint; color = T.green; icon = <CheckCircle2 size={14} />;
    text = "Synchronisation terminée";
  } else {
    bg = "#3A331B"; color = T.gold; icon = <RefreshCw size={14} className={syncing ? "spin" : ""} />;
    text = `${pending} action(s) à synchroniser`;
  }

  return (
    <div className="f-body" style={{
      position: "fixed", bottom: 16, left: 16, zIndex: 60,
      background: bg, color, borderRadius: 999, padding: "9px 14px",
      display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 600,
      boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
    }}>
      <style>{`@keyframes tontine-spin { to { transform: rotate(360deg); } } .spin { animation: tontine-spin 1s linear infinite; }`}</style>
      {icon}
      {text}
      {online && pending > 0 && !syncing && (
        <button onClick={syncNow} style={{
          background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 999, padding: "3px 10px",
          color, fontSize: 11.5, fontWeight: 700, cursor: "pointer", marginLeft: 4,
        }}>
          Synchroniser
        </button>
      )}
    </div>
  );
}
