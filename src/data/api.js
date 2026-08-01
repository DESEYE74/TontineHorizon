import { supabase, isDemoMode } from "../supabaseClient.js";
import { TONTINE, MEMBERS, RECEIPTS } from "./mock.js";
import { nextTurn } from "../lib/rotation.js";

// Toutes les fonctions ci-dessous utilisent Supabase si l'application est
// configurée (voir .env.example), sinon elles retombent sur les données de
// démonstration afin que l'application reste utilisable sans configuration.

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
  // Le code n'est jamais lu directement en base côté client : on passe par
  // une fonction Postgres (RPC) définie dans supabase/schema.sql, qui vérifie
  // le code côté serveur et ne renvoie les données que si la correspondance existe.
  const { data, error } = await supabase.rpc("verify_member_code", { p_code: code });
  if (error || !data) throw new Error("Code personnel invalide.");
  return data;
}

// Réglages de la tontine — lecture publique (nom, montant, tour en cours...)
export async function fetchTontineSettings() {
  if (isDemoMode) return TONTINE;
  const { data, error } = await supabase.from("public_tontine_settings").select("*").single();
  if (error) throw error;
  return {
    name: data.name,
    motto: data.motto,
    amount: data.amount,
    currency: data.currency,
    frequency: data.frequency,
    currentTurn: data.current_turn,
    totalTurns: data.total_turns,
    cycleNumber: data.cycle_number ?? 1,
  };
}

// Réglages de la tontine — écriture, réservée à l'administrateur connecté
export async function updateTontineSettings(fields) {
  if (isDemoMode) {
    Object.assign(TONTINE, fields);
    return TONTINE;
  }
  const dbFields = {};
  if (fields.name !== undefined) dbFields.name = fields.name;
  if (fields.motto !== undefined) dbFields.motto = fields.motto;
  if (fields.amount !== undefined) dbFields.amount = fields.amount;
  if (fields.currency !== undefined) dbFields.currency = fields.currency;
  if (fields.frequency !== undefined) dbFields.frequency = fields.frequency;
  if (fields.currentTurn !== undefined) dbFields.current_turn = fields.currentTurn;
  if (fields.totalTurns !== undefined) dbFields.total_turns = fields.totalTurns;
  if (fields.cycleNumber !== undefined) dbFields.cycle_number = fields.cycleNumber;

  const { data, error } = await supabase
    .from("tontine_settings")
    .update(dbFields)
    .eq("id", 1)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Clôture le tour en cours et passe au suivant (reboucle au tour 1, avec un
// cycle en plus, une fois le dernier tour atteint).
export async function advanceTurn(tontine) {
  const { currentTurn, cycleNumber } = nextTurn(tontine);
  return updateTontineSettings({ currentTurn, cycleNumber });
}

// Membres — lecture publique (roue de rotation, calendrier), sans données sensibles
export async function fetchMembers() {
  if (isDemoMode) return MEMBERS;
  const { data, error } = await supabase.from("public_members").select("*").order("turn");
  if (error) throw error;
  return data;
}

// Membres — lecture complète (code personnel, téléphone), réservée à l'administrateur connecté
export async function fetchMembersAdmin() {
  if (isDemoMode) return MEMBERS.map((m) => ({ ...m, personal_code: m.code, turn_order: m.turn }));
  const { data, error } = await supabase.from("members").select("*").order("turn_order");
  if (error) throw error;
  return data;
}

// Membres — ajout, réservé à l'administrateur connecté
export function generatePersonalCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function addMember({ name, initials, phone, personalCode, turnOrder }) {
  if (isDemoMode) {
    const newMember = { id: Date.now(), name, initials, code: personalCode, turn: turnOrder, status: "upcoming" };
    MEMBERS.push(newMember);
    return newMember;
  }
  const { data, error } = await supabase
    .from("members")
    .insert({
      name,
      initials,
      phone: phone || null,
      personal_code: personalCode,
      turn_order: turnOrder,
      status: "upcoming",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Membres — modification, réservée à l'administrateur connecté
export async function updateMember(id, fields) {
  if (isDemoMode) {
    const m = MEMBERS.find((x) => x.id === id);
    if (m) Object.assign(m, fields);
    return m;
  }
  const dbFields = {};
  if (fields.name !== undefined) dbFields.name = fields.name;
  if (fields.initials !== undefined) dbFields.initials = fields.initials;
  if (fields.phone !== undefined) dbFields.phone = fields.phone || null;
  if (fields.turnOrder !== undefined) dbFields.turn_order = fields.turnOrder;
  if (fields.personalCode !== undefined) dbFields.personal_code = fields.personalCode;

  const { data, error } = await supabase.from("members").update(dbFields).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

// Membres — suppression, réservée à l'administrateur connecté
export async function deleteMember(id) {
  if (isDemoMode) {
    const i = MEMBERS.findIndex((x) => x.id === id);
    if (i >= 0) MEMBERS.splice(i, 1);
    return true;
  }
  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function fetchReceipts() {
  if (isDemoMode) return RECEIPTS;
  const { data, error } = await supabase
    .from("payments")
    .select("id, turn, paid_at, amount, members(name)")
    .order("paid_at", { ascending: false });
  if (error) throw error;
  return data.map((p) => ({
    id: p.id,
    member: p.members?.name ?? "—",
    turn: p.turn,
    date: new Date(p.paid_at).toLocaleDateString("fr-FR"),
    amount: p.amount,
  }));
}

// Versements enregistrés pour un tour donné — sert à calculer qui a payé.
export async function fetchPaymentsForTurn(turn) {
  if (isDemoMode) {
    return MEMBERS.filter((m) => m.status === "paid" || m.status === "current").map((m) => ({ member_id: m.id, turn, amount: TONTINE.amount }));
  }
  const { data, error } = await supabase.from("payments").select("member_id, turn, amount").eq("turn", turn);
  if (error) throw error;
  return data;
}

export async function recordPayment({ memberId, turn, amount }) {
  if (isDemoMode) {
    return { id: `demo-${Date.now()}`, memberId, turn, amount, paid_at: new Date().toISOString() };
  }
  const { data, error } = await supabase
    .from("payments")
    .insert({ member_id: memberId, turn, amount })
    .select()
    .single();
  if (error) throw error;
  return data;
}
