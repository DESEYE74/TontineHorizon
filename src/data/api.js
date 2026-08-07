import { supabase, isDemoMode } from "../supabaseClient.js";
import { TONTINE, MEMBERS, RECEIPTS } from "./mock.js";
import { nextTurn } from "../lib/rotation.js";
import { getCache, setCache, addToOutbox } from "../lib/offlineDb.js";
import { cacheAdminLogin, verifyAdminOffline, cacheMemberLogin, verifyMemberOffline } from "../lib/authCache.js";
import {
  remoteFetchTontineSettings, remoteUpdateTontineSettings,
  remoteFetchMembers, remoteFetchMembersAdmin, remoteAddMember, remoteUpdateMember, remoteDeleteMember,
  remoteFetchReceipts, remoteFetchPaymentsForTurn, remoteRecordPayment,
} from "./remote.js";

// ============================================================
// Cette couche fait 3 choses à la fois, en mode réel (Supabase) :
//  1. LECTURE : essaie le réseau, et si ça échoue, retombe sur la dernière
//     copie connue (gardée dans IndexedDB) pour que l'appli reste utilisable
//     hors connexion, même avec des données un peu anciennes.
//  2. ÉCRITURE : si hors-ligne, l'action est mise en file d'attente
//     (IndexedDB) et rejouée automatiquement au retour du réseau (voir
//     lib/sync.js), avec une mise à jour "optimiste" du cache local pour que
//     l'interface reflète immédiatement le changement.
//  3. MODE DÉMO : aucune de ces logiques n'intervient, tout reste en mémoire.
// ============================================================

function isNetworkError(err) {
  return !navigator.onLine || err?.message?.includes("fetch") || err?.name === "TypeError";
}

async function readWithCache(key, remoteFn) {
  try {
    const data = await remoteFn();
    await setCache(key, data);
    return data;
  } catch (err) {
    const cached = await getCache(key);
    if (cached !== undefined) return cached;
    throw err;
  }
}

// action: { type, payload } — type doit correspondre à un handler dans lib/sync.js
async function writeOrQueue({ type, payload, remoteFn, applyOptimistic }) {
  const goOffline = async () => {
    await addToOutbox({ type, payload });
    if (applyOptimistic) await applyOptimistic();
    return { pending: true };
  };
  if (!navigator.onLine) return goOffline();
  try {
    return await remoteFn();
  } catch (err) {
    if (isNetworkError(err)) return goOffline();
    throw err;
  }
}

// ---- Authentification ----------------------------------------------------
export async function loginAdmin(email, password) {
  if (isDemoMode) {
    if (!email || !password) throw new Error("Identifiant et mot de passe requis.");
    return { email };
  }
  if (!navigator.onLine) {
    const cached = await verifyAdminOffline(email, password);
    if (cached) return cached;
    throw new Error("Hors connexion : identifiants non reconnus sur cet appareil. Une première connexion en ligne est nécessaire.");
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await cacheAdminLogin(email, password, data.user);
    return data.user;
  } catch (err) {
    if (isNetworkError(err)) {
      const cached = await verifyAdminOffline(email, password);
      if (cached) return cached;
    }
    throw err;
  }
}

export async function loginMember(code) {
  if (isDemoMode) {
    const member = MEMBERS.find((m) => m.code === code);
    if (!member) throw new Error("Code personnel invalide.");
    return member;
  }
  if (!navigator.onLine) {
    const cached = verifyMemberOffline(code);
    if (cached) return cached;
    throw new Error("Hors connexion : ce code n'a pas encore été utilisé sur cet appareil. Une première connexion en ligne est nécessaire.");
  }
  try {
    const { data, error } = await supabase.rpc("verify_member_code", { p_code: code });
    if (error || !data) throw new Error("Code personnel invalide.");
    cacheMemberLogin(code, data);
    return data;
  } catch (err) {
    if (isNetworkError(err)) {
      const cached = verifyMemberOffline(code);
      if (cached) return cached;
    }
    throw err;
  }
}

// ---- Réglages de la tontine ------------------------------------------------
export async function fetchTontineSettings() {
  if (isDemoMode) return TONTINE;
  return readWithCache("tontine_settings", remoteFetchTontineSettings);
}

export async function updateTontineSettings(fields) {
  if (isDemoMode) {
    Object.assign(TONTINE, fields);
    return TONTINE;
  }
  return writeOrQueue({
    type: "updateTontineSettings",
    payload: fields,
    remoteFn: async () => {
      const data = await remoteUpdateTontineSettings(fields);
      await setCache("tontine_settings", await remoteFetchTontineSettings());
      return data;
    },
    applyOptimistic: async () => {
      const current = (await getCache("tontine_settings")) || TONTINE;
      const merged = { ...current, ...fields };
      await setCache("tontine_settings", merged);
    },
  });
}

export async function advanceTurn(tontine, totalTurns) {
  const { currentTurn, cycleNumber } = nextTurn({ ...tontine, totalTurns });
  return updateTontineSettings({ currentTurn, cycleNumber });
}

// ---- Membres ----------------------------------------------------------------
export async function fetchMembers() {
  if (isDemoMode) return MEMBERS;
  return readWithCache("members", remoteFetchMembers);
}

export async function fetchMembersAdmin() {
  if (isDemoMode) return MEMBERS.map((m) => ({ ...m, personal_code: m.code, turn_order: m.turn }));
  return readWithCache("members_admin", remoteFetchMembersAdmin);
}

export function generatePersonalCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function addMember(payload) {
  if (isDemoMode) {
    const newMember = { id: Date.now(), name: payload.name, initials: payload.initials, code: payload.personalCode, turn: payload.turnOrder, status: "upcoming" };
    MEMBERS.push(newMember);
    return newMember;
  }
  return writeOrQueue({
    type: "addMember",
    payload,
    remoteFn: () => remoteAddMember(payload),
    applyOptimistic: async () => {
      const list = (await getCache("members_admin")) || [];
      const tempId = `pending-${Date.now()}`;
      const optimisticMember = {
        id: tempId, name: payload.name, initials: payload.initials, phone: payload.phone || null,
        personal_code: payload.personalCode, turn_order: payload.turnOrder, status: "upcoming", _pending: true,
      };
      await setCache("members_admin", [...list, optimisticMember]);
      const publicList = (await getCache("members")) || [];
      await setCache("members", [...publicList, { id: tempId, name: payload.name, initials: payload.initials, turn: payload.turnOrder, status: "upcoming", _pending: true }]);
    },
  });
}

export async function updateMember(id, fields) {
  if (isDemoMode) {
    const m = MEMBERS.find((x) => x.id === id);
    if (m) Object.assign(m, fields);
    return m;
  }
  return writeOrQueue({
    type: "updateMember",
    payload: { id, fields },
    remoteFn: () => remoteUpdateMember(id, fields),
    applyOptimistic: async () => {
      const list = (await getCache("members_admin")) || [];
      await setCache("members_admin", list.map((m) => (m.id === id ? { ...m, ...toAdminShape(fields), _pending: true } : m)));
      const publicList = (await getCache("members")) || [];
      await setCache("members", publicList.map((m) => (m.id === id ? { ...m, ...toPublicShape(fields), _pending: true } : m)));
    },
  });
}

function toAdminShape(fields) {
  const out = {};
  if (fields.name !== undefined) out.name = fields.name;
  if (fields.initials !== undefined) out.initials = fields.initials;
  if (fields.phone !== undefined) out.phone = fields.phone;
  if (fields.turnOrder !== undefined) out.turn_order = fields.turnOrder;
  return out;
}
function toPublicShape(fields) {
  const out = {};
  if (fields.name !== undefined) out.name = fields.name;
  if (fields.initials !== undefined) out.initials = fields.initials;
  if (fields.turnOrder !== undefined) out.turn = fields.turnOrder;
  return out;
}

export async function deleteMember(id) {
  if (isDemoMode) {
    const i = MEMBERS.findIndex((x) => x.id === id);
    if (i >= 0) MEMBERS.splice(i, 1);
    return true;
  }
  return writeOrQueue({
    type: "deleteMember",
    payload: { id },
    remoteFn: () => remoteDeleteMember(id),
    applyOptimistic: async () => {
      const list = (await getCache("members_admin")) || [];
      await setCache("members_admin", list.filter((m) => m.id !== id));
      const publicList = (await getCache("members")) || [];
      await setCache("members", publicList.filter((m) => m.id !== id));
    },
  });
}

// ---- Reçus / versements -------------------------------------------------------
function withReference(receipt) {
  const code = receipt.memberCode || "------";
  return { ...receipt, reference: `${code}T${receipt.turn}C${receipt.cycle ?? 1}` };
}

export async function fetchReceipts() {
  if (isDemoMode) {
    return RECEIPTS.map((r) => withReference({ ...r, memberCode: r.memberCode || "947162", cycle: r.cycle || TONTINE.cycleNumber || 1 }));
  }
  const data = await readWithCache("receipts", remoteFetchReceipts);
  return data.map(withReference);
}

export async function fetchPaymentsForTurn(turn) {
  if (isDemoMode) {
    return MEMBERS.filter((m) => m.status === "paid" || m.status === "current").map((m) => ({ member_id: m.id, turn, amount: TONTINE.amount }));
  }
  return readWithCache(`payments_turn_${turn}`, () => remoteFetchPaymentsForTurn(turn));
}

export async function recordPayment({ memberId, turn, cycle, amount, memberName, memberCode }) {
  if (isDemoMode) {
    return { id: `demo-${Date.now()}`, memberId, turn, cycle, amount, paid_at: new Date().toISOString() };
  }
  return writeOrQueue({
    type: "recordPayment",
    payload: { memberId, turn, cycle, amount },
    remoteFn: () => remoteRecordPayment({ memberId, turn, cycle, amount }),
    applyOptimistic: async () => {
      const key = `payments_turn_${turn}`;
      const cached = (await getCache(key)) || [];
      await setCache(key, [...cached, { member_id: memberId, turn, amount, _pending: true }]);
      const receipts = (await getCache("receipts")) || [];
      await setCache("receipts", [
        { id: `pending-${Date.now()}`, member: memberName || "—", memberCode: memberCode || "", turn, cycle, date: new Date().toLocaleDateString("fr-FR"), amount, _pending: true },
        ...receipts,
      ]);
    },
  });
}
