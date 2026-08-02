// Petite couche IndexedDB, sans dépendance externe :
// - un magasin "cache" : dernière copie connue de chaque donnée (clé -> valeur)
// - un magasin "outbox" : actions en attente d'être renvoyées à Supabase
//   dès que la connexion revient (versement, ajout de membre, etc.)

const DB_NAME = "tontine-offline";
const DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("cache")) {
        db.createObjectStore("cache", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("outbox")) {
        db.createObjectStore("outbox", { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Certains navigateurs (ou modes de navigation privée très restreints) ne
// supportent pas IndexedDB : on ne casse jamais l'application pour autant.
async function safeDb() {
  if (typeof indexedDB === "undefined") return null;
  try {
    return await openDb();
  } catch {
    return null;
  }
}

export async function getCache(key) {
  const db = await safeDb();
  if (!db) return undefined;
  return new Promise((resolve) => {
    const tx = db.transaction("cache", "readonly");
    const req = tx.objectStore("cache").get(key);
    req.onsuccess = () => resolve(req.result?.value);
    req.onerror = () => resolve(undefined);
  });
}

export async function setCache(key, value) {
  const db = await safeDb();
  if (!db) return;
  return new Promise((resolve) => {
    const tx = db.transaction("cache", "readwrite");
    tx.objectStore("cache").put({ key, value, savedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export async function addToOutbox(action) {
  const db = await safeDb();
  if (!db) return null;
  return new Promise((resolve) => {
    const tx = db.transaction("outbox", "readwrite");
    const req = tx.objectStore("outbox").add({ ...action, createdAt: Date.now() });
    req.onsuccess = () => resolve(req.result);
    tx.onerror = () => resolve(null);
  });
}

export async function getOutbox() {
  const db = await safeDb();
  if (!db) return [];
  return new Promise((resolve) => {
    const tx = db.transaction("outbox", "readonly");
    const req = tx.objectStore("outbox").getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}

export async function removeFromOutbox(id) {
  const db = await safeDb();
  if (!db) return;
  return new Promise((resolve) => {
    const tx = db.transaction("outbox", "readwrite");
    tx.objectStore("outbox").delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export async function countOutbox() {
  const items = await getOutbox();
  return items.length;
}
