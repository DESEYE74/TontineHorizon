import { getOutbox, removeFromOutbox } from "./offlineDb.js";
import {
  remoteUpdateTontineSettings,
  remoteAddMember,
  remoteUpdateMember,
  remoteDeleteMember,
  remoteRecordPayment,
} from "../data/remote.js";

const HANDLERS = {
  updateTontineSettings: (payload) => remoteUpdateTontineSettings(payload),
  addMember: (payload) => remoteAddMember(payload),
  updateMember: (payload) => remoteUpdateMember(payload.id, payload.fields),
  deleteMember: (payload) => remoteDeleteMember(payload.id),
  recordPayment: (payload) => remoteRecordPayment(payload),
};

let syncing = false;

// Rejoue, dans l'ordre, toutes les actions faites hors-ligne. Renvoie le
// nombre d'actions traitées avec succès. S'arrête au premier échec réseau
// (on réessaiera au prochain retour de connexion) mais continue si une seule
// action échoue pour une autre raison (pour ne pas bloquer les suivantes).
export async function flushOutbox(onProgress) {
  if (syncing) return 0;
  syncing = true;
  let done = 0;
  try {
    const items = await getOutbox();
    items.sort((a, b) => a.createdAt - b.createdAt);
    for (const item of items) {
      const handler = HANDLERS[item.type];
      if (!handler) {
        await removeFromOutbox(item.id);
        continue;
      }
      try {
        await handler(item.payload);
        await removeFromOutbox(item.id);
        done += 1;
        onProgress?.(done, items.length);
      } catch (err) {
        // Toujours hors-ligne (ou serveur inaccessible) : on arrête ici,
        // l'action reste en file et sera retentée plus tard.
        break;
      }
    }
  } finally {
    syncing = false;
  }
  return done;
}

// À appeler une fois au démarrage de l'application, et à chaque fois que
// le navigateur signale un retour de connexion.
export function watchConnectivity(onSyncDone) {
  const trySync = async () => {
    if (navigator.onLine) {
      const done = await flushOutbox();
      if (done > 0) onSyncDone?.(done);
    }
  };
  window.addEventListener("online", trySync);
  trySync(); // tentative immédiate au chargement, au cas où des actions seraient déjà en attente
  return () => window.removeEventListener("online", trySync);
}
