import React, { useEffect, useState } from "react";
import { UserPlus, RefreshCw, Phone, Pencil, Trash2, X, Check } from "lucide-react";
import { T } from "../theme.jsx";
import { Screen, Pill } from "./UI.jsx";
import { fetchMembersAdmin, fetchTontineSettings, addMember, updateMember, deleteMember, generatePersonalCode } from "../data/api.js";
import { rotationStatus } from "../lib/rotation.js";

const inputStyle = {
  width: "100%", border: `1px solid ${T.line}`, borderRadius: 9, padding: "9px 12px",
  fontSize: 13.5, outline: "none", boxSizing: "border-box",
};

const initialsOf = (name) => name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export default function MembersView() {
  const [members, setMembers] = useState([]);
  const [tontine, setTontine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", code: generatePersonalCode() });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", turn_order: 1 });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [data, t] = await Promise.all([fetchMembersAdmin(), fetchTontineSettings()]);
      setMembers(data);
      setTontine(t);
    } catch (e) {
      setError(e.message || "Impossible de charger les membres.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await addMember({
        name: form.name.trim(),
        initials: initialsOf(form.name),
        phone: form.phone.trim(),
        personalCode: form.code,
        turnOrder: members.length + 1,
      });
      setForm({ name: "", phone: "", code: generatePersonalCode() });
      setShowForm(false);
      load();
    } catch (e) {
      setError(e.message?.includes("duplicate") ? "Ce code personnel est déjà utilisé, régénérez-en un." : (e.message || "Erreur lors de l'ajout."));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (m) => {
    setEditingId(m.id);
    setEditForm({ name: m.name, phone: m.phone || "", turn_order: m.turn_order });
    setConfirmDeleteId(null);
  };

  const saveEdit = async (id) => {
    setSaving(true);
    setError("");
    try {
      await updateMember(id, {
        name: editForm.name.trim(),
        initials: initialsOf(editForm.name || "?"),
        phone: editForm.phone.trim(),
        turnOrder: Number(editForm.turn_order),
      });
      setEditingId(null);
      load();
    } catch (e) {
      setError(e.message || "Erreur lors de la modification.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (id) => {
    setSaving(true);
    setError("");
    try {
      await deleteMember(id);
      setConfirmDeleteId(null);
      load();
    } catch (e) {
      setError(e.message || "Erreur lors de la suppression.");
    } finally {
      setSaving(false);
    }
  };

  const currentTurn = tontine?.currentTurn ?? 1;

  return (
    <Screen
      title="Membres"
      subtitle={`${members.length} membre(s) dans la tontine`}
      action={
        <button onClick={() => setShowForm((s) => !s)} style={{
          display: "flex", alignItems: "center", gap: 6, background: T.ink, color: "#fff", border: "none",
          borderRadius: 10, padding: "10px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
        }}>
          <UserPlus size={15} /> Ajouter un membre
        </button>
      }
    >
      {showForm && (
        <div style={{ background: "#fff", border: `1px solid ${T.line}`, borderRadius: 14, padding: 18, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 2, minWidth: 180 }}>
              <label style={{ fontSize: 12, color: T.textSoft }}>Nom complet</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ex. Awa Koné" style={{ ...inputStyle, marginTop: 4 }} />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 12, color: T.textSoft }}>Téléphone (optionnel)</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+225 ..." style={{ ...inputStyle, marginTop: 4 }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 14, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={{ fontSize: 12, color: T.textSoft }}>Code personnel (à communiquer au membre)</label>
              <input value={form.code} readOnly className="f-mono" style={{ ...inputStyle, marginTop: 4, letterSpacing: 3, fontWeight: 600 }} />
            </div>
            <button onClick={() => setForm({ ...form, code: generatePersonalCode() })} style={{
              display: "flex", alignItems: "center", gap: 6, background: T.stone, border: `1px solid ${T.line}`,
              borderRadius: 9, padding: "9px 12px", fontSize: 12.5, cursor: "pointer", color: T.text,
            }}>
              <RefreshCw size={13} /> Regénérer
            </button>
          </div>
          {error && <p style={{ color: T.rust, fontSize: 12.5, marginBottom: 10 }}>{error}</p>}
          <button onClick={submit} disabled={!form.name.trim() || saving} style={{
            background: T.gold, border: "none", borderRadius: 9, padding: "10px 18px", fontWeight: 700,
            fontSize: 13, color: "#2A2205", cursor: "pointer", opacity: !form.name.trim() || saving ? 0.6 : 1,
          }}>
            {saving ? "Ajout…" : "Ajouter ce membre"}
          </button>
        </div>
      )}

      {loading ? (
        <p style={{ color: T.textSoft, fontSize: 13.5 }}>Chargement…</p>
      ) : (
        <div className="scroll-list" style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: "8px 20px" }}>
          {members.map((m) => (
            <div key={m.id} style={{ padding: "9px 0", borderBottom: `1px solid ${T.line}` }}>
              {editingId === m.id ? (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                  <div style={{ flex: 2, minWidth: 160 }}>
                    <label style={{ fontSize: 11.5, color: T.textSoft }}>Nom</label>
                    <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={{ ...inputStyle, marginTop: 2 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <label style={{ fontSize: 11.5, color: T.textSoft }}>Téléphone</label>
                    <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} style={{ ...inputStyle, marginTop: 2 }} />
                  </div>
                  <div style={{ width: 80 }}>
                    <label style={{ fontSize: 11.5, color: T.textSoft }}>Tour</label>
                    <input type="number" value={editForm.turn_order} onChange={(e) => setEditForm({ ...editForm, turn_order: e.target.value })} style={{ ...inputStyle, marginTop: 2 }} />
                  </div>
                  <button onClick={() => saveEdit(m.id)} disabled={saving} style={{
                    background: T.green, border: "none", borderRadius: 9, width: 36, height: 36, display: "flex",
                    alignItems: "center", justifyContent: "center", cursor: "pointer",
                  }}>
                    <Check size={16} color="#fff" />
                  </button>
                  <button onClick={() => setEditingId(null)} style={{
                    background: T.stone, border: `1px solid ${T.line}`, borderRadius: 9, width: 36, height: 36, display: "flex",
                    alignItems: "center", justifyContent: "center", cursor: "pointer",
                  }}>
                    <X size={16} color={T.textSoft} />
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: T.stone, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: T.text, flexShrink: 0 }}>
                      {m.initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 600, margin: 0, color: T.text }}>{m.name}</p>
                      <p style={{ fontSize: 11.5, color: T.textSoft, margin: 0, display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                        Tour {m.turn_order} {m.phone && <><Phone size={10} /> {m.phone}</>}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span className="f-mono" style={{ fontSize: 12.5, color: T.textSoft, whiteSpace: "nowrap" }}>Code : {m.personal_code}</span>
                    <Pill status={rotationStatus(m.turn_order, currentTurn)} />
                    <button onClick={() => startEdit(m)} title="Modifier" style={{
                      background: "none", border: "none", cursor: "pointer", padding: 4, color: T.textSoft,
                    }}>
                      <Pencil size={15} />
                    </button>
                    {confirmDeleteId === m.id ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11.5, color: T.rust }}>Confirmer ?</span>
                        <button onClick={() => confirmDelete(m.id)} disabled={saving} style={{
                          background: T.rust, border: "none", borderRadius: 7, padding: "4px 8px", color: "#fff", fontSize: 11.5, cursor: "pointer",
                        }}>Oui</button>
                        <button onClick={() => setConfirmDeleteId(null)} style={{
                          background: T.stone, border: `1px solid ${T.line}`, borderRadius: 7, padding: "4px 8px", fontSize: 11.5, cursor: "pointer",
                        }}>Non</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(m.id)} title="Supprimer" style={{
                        background: "none", border: "none", cursor: "pointer", padding: 4, color: T.rust,
                      }}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {error && <p style={{ color: T.rust, fontSize: 12.5, padding: "10px 0" }}>{error}</p>}
        </div>
      )}
    </Screen>
  );
}
