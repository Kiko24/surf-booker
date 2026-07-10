"use client";

import { useState } from "react";
import { updateProfile, updatePassword } from "../actions";

function splitPhone(stored: string | null): { prefix: string; number: string } {
  const s = stored ?? "";
  const match = s.match(/^(\+?\d{1,4})?[\s.-]?(.*)$/);
  return { prefix: match?.[1] ?? "", number: match?.[2] ?? s };
}

type Props = {
  student: { full_name: string; email: string | null; phone: string | null } | null;
  authEmail: string | null;
};

export function DefinicoesView({ student, authEmail }: Props) {
  const parsed = splitPhone(student?.phone ?? null);
  const [name, setName] = useState(student?.full_name ?? "");
  const [email, setEmail] = useState(student?.email ?? authEmail ?? "");
  const [phonePrefix, setPhonePrefix] = useState(parsed.prefix);
  const [phoneNumber, setPhoneNumber] = useState(parsed.number);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    setSaveErrors({});

    const fullPhone = phonePrefix || phoneNumber ? `${phonePrefix}${phoneNumber ? " " : ""}${phoneNumber}`.trim() : null;
    const res = await updateProfile({
      fullName: name,
      email,
      phone: fullPhone,
    });

    if (res.success) {
      setSaveMsg({ ok: true, text: "Alterações guardadas." });
    } else if (res.errors) {
      setSaveErrors(res.errors);
    } else {
      setSaveMsg({ ok: false, text: res.error ?? "Erro ao guardar." });
    }
    setSaving(false);
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwSaving(true);
    setPwError(null);
    const res = await updatePassword({ currentPassword: currentPw, newPassword: newPw });
    if (!res.success) {
      setPwError(res.error ?? "Erro ao redefinir password.");
      setPwSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Definições</h1>
        <p className="text-gray-500">Configurações do teu perfil e preferências.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Perfil</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="df-name" className="mb-1 block text-sm font-medium text-gray-700">
              Nome
            </label>
            <input
              id="df-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={120}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {saveErrors.fullName && (
              <p className="mt-1 text-xs text-red-600">{saveErrors.fullName}</p>
            )}
          </div>

          <div>
            <label htmlFor="df-email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="df-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              maxLength={160}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {saveErrors.email && (
              <p className="mt-1 text-xs text-red-600">{saveErrors.email}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Telemóvel
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phonePrefix}
                onChange={e => setPhonePrefix(e.target.value.replace(/[^+0-9]/g, ""))}
                placeholder="+351"
                maxLength={5}
                className="w-20 shrink-0 rounded-lg border border-gray-300 px-2 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <input
                id="df-phone"
                type="tel"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value.replace(/[^0-9() /.\-]/g, ""))}
                placeholder="912345678"
                maxLength={15}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            {saveErrors.phone && (
              <p className="mt-1 text-xs text-red-600">{saveErrors.phone}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
            >
              {saving ? "A guardar…" : "Guardar alterações"}
            </button>
            {saveMsg && (
              <span className={`text-sm ${saveMsg.ok ? "text-green-600" : "text-red-600"}`}>
                {saveMsg.text}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Segurança</h2>
        {!showPasswordForm ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Password</p>
              <p className="text-sm text-gray-900">••••••••••</p>
            </div>
            <button
              onClick={() => setShowPasswordForm(true)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Redefinir password
            </button>
          </div>
        ) : (
          <form onSubmit={handlePassword} className="space-y-4">
            <div>
              <label htmlFor="df-current-pw" className="mb-1 block text-sm font-medium text-gray-700">
                Password atual
              </label>
              <input
                id="df-current-pw"
                type="password"
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                maxLength={128}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                required
              />
            </div>
            <div>
              <label htmlFor="df-new-pw" className="mb-1 block text-sm font-medium text-gray-700">
                Nova password
              </label>
              <input
                id="df-new-pw"
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                maxLength={128}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                required
                minLength={8}
              />
              <p className="mt-1 text-xs text-gray-400">
                Mínimo 8 caracteres, 1 maiúscula, 1 número
              </p>
            </div>
            {pwError && <p className="text-sm text-red-600">{pwError}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={pwSaving}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
              >
                {pwSaving ? "A redefinir…" : "Redefinir password"}
              </button>
              <button
                type="button"
                onClick={() => { setShowPasswordForm(false); setPwError(null); setCurrentPw(""); setNewPw(""); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
