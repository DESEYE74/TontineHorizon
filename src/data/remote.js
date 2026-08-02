// Ce fichier ne contient QUE des appels directs à Supabase, sans logique
// hors-ligne. Il est utilisé par data/api.js (couche publique, avec cache et
// file d'attente) et par lib/sync.js (pour rejouer les actions en attente).

import { supabase } from "../supabaseClient.js";

export async function remoteFetchTontineSettings() {
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

export async function remoteUpdateTontineSettings(fields) {
  const dbFields = {};
  if (fields.name !== undefined) dbFields.name = fields.name;
  if (fields.motto !== undefined) dbFields.motto = fields.motto;
  if (fields.amount !== undefined) dbFields.amount = fields.amount;
  if (fields.currency !== undefined) dbFields.currency = fields.currency;
  if (fields.frequency !== undefined) dbFields.frequency = fields.frequency;
  if (fields.currentTurn !== undefined) dbFields.current_turn = fields.currentTurn;
  if (fields.totalTurns !== undefined) dbFields.total_turns = fields.totalTurns;
  if (fields.cycleNumber !== undefined) dbFields.cycle_number = fields.cycleNumber;

  const { data, error } = await supabase.from("tontine_settings").update(dbFields).eq("id", 1).select().single();
  if (error) throw error;
  return data;
}

export async function remoteFetchMembers() {
  const { data, error } = await supabase.from("public_members").select("*").order("turn");
  if (error) throw error;
  return data;
}

export async function remoteFetchMembersAdmin() {
  const { data, error } = await supabase.from("members").select("*").order("turn_order");
  if (error) throw error;
  return data;
}

export async function remoteAddMember({ name, initials, phone, personalCode, turnOrder }) {
  const { data, error } = await supabase
    .from("members")
    .insert({ name, initials, phone: phone || null, personal_code: personalCode, turn_order: turnOrder, status: "upcoming" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function remoteUpdateMember(id, fields) {
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

export async function remoteDeleteMember(id) {
  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function remoteFetchReceipts() {
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

export async function remoteFetchPaymentsForTurn(turn) {
  const { data, error } = await supabase.from("payments").select("member_id, turn, amount").eq("turn", turn);
  if (error) throw error;
  return data;
}

export async function remoteRecordPayment({ memberId, turn, amount }) {
  const { data, error } = await supabase.from("payments").insert({ member_id: memberId, turn, amount }).select().single();
  if (error) throw error;
  return data;
}
