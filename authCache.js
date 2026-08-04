// Permet à l'administrateur et aux membres de se reconnecter hors-ligne,
// SANS jamais stocker de mot de passe en clair : on ne garde qu'une
// empreinte (hachage SHA-256) créée lors d'une connexion réussie en ligne.
// Hors-ligne, on compare la même empreinte plutôt que d'appeler Supabase.

const KEY = "tontine_auth_cache";

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // stockage indisponible (navigation très restreinte) : pas de connexion hors-ligne possible, sans gravité
  }
}

// ---- Administrateur (email + mot de passe) --------------------------------
export async function cacheAdminLogin(email, password, me) {
  const hash = await sha256(`${email}:${password}`);
  const cache = readCache();
  cache.admin = { email, hash, me };
  writeCache(cache);
}

export async function verifyAdminOffline(email, password) {
  const cache = readCache();
  if (!cache.admin || cache.admin.email !== email) return null;
  const hash = await sha256(`${email}:${password}`);
  return cache.admin.hash === hash ? cache.admin.me : null;
}

// ---- Membre (code personnel) ----------------------------------------------
export function cacheMemberLogin(code, me) {
  const cache = readCache();
  cache.members = cache.members || {};
  cache.members[code] = me;
  writeCache(cache);
}

export function verifyMemberOffline(code) {
  const cache = readCache();
  return cache.members?.[code] ?? null;
}
