import { supabase, isDemoMode } from "../supabaseClient.js";
import { TONTINE, MEMBERS, RECEIPTS } from "./mock.js";
import { nextTurn } from "../lib/rotation.js";
import {
  remoteFetchTontineSettings, remoteUpdateTontineSettings,
  remoteFetchMembers, remoteFetchMembersAdmin, remoteAddMember, remoteUpdateMember, remoteDeleteMember, remoteAssignPriorityTurn,
  remoteFetchReceipts, remoteFetchPaymentsForTurn, remoteRecordPayment,
} from "./remote.js";

// Couche d'accès aux données : en mode démo (Supabase non configuré), tout
// reste en mémoire pour permettre de tester l'application sans configuration.
// Sinon, chaque fonction appelle directement Supabase.

// ---- Authentification ----------------------------------------------------
export async function loginAdmin(email, password) {
  if (isDemoMode) {
    if (!email || !password) throw new Error("Identifiant et mot de passe requis.");
    return { email };
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function loginMember(code) {
  if (isDemoMode) {
    const member = MEMBERS.find((m) => m.code === code);
    if (!member) throw new Error("Code personnel invalide.");
    return member;
  }
  const { data, error } = await supabase.rpc("verify_member_code", { p_code: code });
  if (error || !data) throw new Error("Code personnel invalide.");
  return data;
}

// ---- Réglages de la tontine ------------------------------------------------
export async function fetchTontineSettings() {
  if (isDemoMode) return TONTINE;
  return remoteFetchTontineSettings();
}

export async function updateTontineSettings(fields) {
  if (isDemoMode) {
    Object.assign(TONTINE, fields);
    return TONTINE;
  }
  return remoteUpdateTontineSettings(fields);
}

export async function advanceTurn(tontine, totalTurns) {
  const { currentTurn, cycleNumber } = nextTurn({ ...tontine, totalTurns });
  return updateTontineSettings({ currentTurn, cycleNumber });
}

// ---- Membres ----------------------------------------------------------------
export async function fetchMembers() {
  if (isDemoMode) return MEMBERS;
  return remoteFetchMembers();
}

export async function fetchMembersAdmin() {
  if (isDemoMode) return MEMBERS.map((m) => ({ ...m, personal_code: m.code, turn_order: m.turn }));
  return remoteFetchMembersAdmin();
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
  return remoteAddMember(payload);
}

export async function updateMember(id, fields) {
  if (isDemoMode) {
    const m = MEMBERS.find((x) => x.id === id);
    if (m) Object.assign(m, fields);
    return m;
  }
  return remoteUpdateMember(id, fields);
}

export async function deleteMember(id) {
  if (isDemoMode) {
    const i = MEMBERS.findIndex((x) => x.id === id);
    if (i >= 0) MEMBERS.splice(i, 1);
    return true;
  }
  return remoteDeleteMember(id);
}

// Donner la priorité à un membre (cas d'urgence) : le fait passer en tête de
// file pour le tour en cours, en décalant les autres d'un cran.
export async function assignPriorityTurn(memberId) {
  if (isDemoMode) {
    const target = MEMBERS.find((m) => m.id === memberId);
    const tontine = TONTINE;
    if (!target) throw new Error("Membre introuvable.");
    if (target.turn === tontine.currentTurn) return true;
    if (target.turn < tontine.currentTurn) throw new Error("Ce membre a déjà reçu la caisse pour ce cycle.");
    MEMBERS.forEach((m) => {
      if (m.turn >= tontine.currentTurn && m.turn < target.turn) m.turn += 1;
    });
    target.turn = tontine.currentTurn;
    return true;
  }
  const tontine = await remoteFetchTontineSettings();
  return remoteAssignPriorityTurn(memberId, tontine.currentTurn ?? 1);
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
  const data = await remoteFetchReceipts();
  return data.map(withReference);
}

export async function fetchPaymentsForTurn(turn) {
  if (isDemoMode) {
    return MEMBERS.filter((m) => m.status === "paid" || m.status === "current").map((m) => ({ member_id: m.id, turn, amount: TONTINE.amount }));
  }
  return remoteFetchPaymentsForTurn(turn);
}

export async function recordPayment({ memberId, turn, cycle, amount }) {
  if (isDemoMode) {
    return { id: `demo-${Date.now()}`, memberId, turn, cycle, amount, paid_at: new Date().toISOString() };
  }
  return remoteRecordPayment({ memberId, turn, cycle, amount });
}
