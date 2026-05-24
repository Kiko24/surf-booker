"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { addSchoolImage, deleteImage, getImages, saveInstructor, deleteInstructor, getInstructors, getSchoolSettings, saveSchoolSettings, saveSchoolInfo, type SchoolImage, type Instructor, type SchoolSettings } from "../actions";

type Props = {
  fullName: string;
  email: string;
  phone: string;
  schoolName: string | null;
  schoolLogoUrl: string | null;
  schoolLocation: string | null;
  schoolDescription: string | null;
  cancellationWindowHours: number;
  schoolId: string | null;
};

export function MaisView({ schoolName, schoolLogoUrl, fullName, email, phone, schoolLocation, schoolDescription, cancellationWindowHours, schoolId }: Props) {
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);
  const [profileName, setProfileName] = useState(fullName);
  const [profileEmail, setProfileEmail] = useState(email);
  const [profilePhone, setProfilePhone] = useState(phone);
  const [profilePassword, setProfilePassword] = useState("");
  const [profileConfirmPassword, setProfileConfirmPassword] = useState("");
  const [showCompany, setShowCompany] = useState(false);
  const [companyName, setCompanyName] = useState(schoolName ?? "");
  const [companyLocation, setCompanyLocation] = useState(schoolLocation ?? "");
  const [companyDescription, setCompanyDescription] = useState(schoolDescription ?? "");
  const [showInstructors, setShowInstructors] = useState(false);
  const [instrutorNome, setInstrutorNome] = useState("");
  const [instrutorNivel, setInstrutorNivel] = useState("");
  const [instrutorFotoFile, setInstrutorFotoFile] = useState<File | null>(null);
  const [instrutorFotoPreview, setInstrutorFotoPreview] = useState<string | null>(null);
  const [instrutores, setInstrutores] = useState<Instructor[]>([]);
  const [editingInstrutorId, setEditingInstrutorId] = useState<string | null>(null);
  const instrutorFileRef = useRef<HTMLInputElement>(null);
  const [instrutorSaving, setInstrutorSaving] = useState(false);
  const [instrutorError, setInstrutorError] = useState("");

  useEffect(() => {
    if (showInstructors && schoolId) {
      getInstructors(schoolId).then(setInstrutores);
    }
  }, [showInstructors, schoolId]);

  useEffect(() => {
    if (showCompany && schoolId) {
      getImages(schoolId).then(setImages);
    }
  }, [showCompany, schoolId]);

  const loadInstructors = useCallback(() => {
    if (schoolId) getInstructors(schoolId).then(setInstrutores);
  }, [schoolId]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<SchoolImage[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);

  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<SchoolSettings>({
    cancellation_window_hours: cancellationWindowHours,
    low_occupancy_threshold: 40,
    notify_email_confirmation: true,
    notify_reminder_24h: true,
    notify_sms_cancellation: false,
    notify_new_schedule: true,
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [companySaving, setCompanySaving] = useState(false);

  useEffect(() => {
    if (showSettings && schoolId) {
      getSchoolSettings(schoolId).then((s) => {
        if (s) setSettings(s);
      });
    }
  }, [showSettings, schoolId]);

  const openProfile = useCallback(() => {
    setProfileName(fullName);
    setProfileEmail(email);
    setProfilePhone(phone);
    setProfilePassword("");
    setProfileConfirmPassword("");
    setShowProfile(true);
    setSelectedSection("profile");
  }, [fullName, email, phone]);

  function getInitials(name: string): string {
    return name.split(" ").map(p => p[0]).join("").substring(0, 2).toUpperCase();
  }

  return (
    <>
      <main className="px-5 pt-4">
        {/* School Header — above grid */}
        <div className="mt-6 mb-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => logoFileRef.current?.click()}
            className="shrink-0"
          >
            {(logoPreview ?? schoolLogoUrl) ? (
              <img
                src={logoPreview ?? schoolLogoUrl!}
                alt={schoolName ?? "Logo"}
                className="h-16 w-16 rounded-full object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface shadow-lg transition-colors hover:bg-[#2A2A2A]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-text-muted">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
                </svg>
              </div>
            )}
          </button>
          <input
            ref={logoFileRef}
            type="file"
            accept="image/png,image/webp,image/jpeg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (!["image/png", "image/webp", "image/jpeg"].includes(file.type)) {
                console.error("Formato não permitido. Usa PNG, WebP ou JPEG");
                return;
              }
              if (file.size > 2048 * 1024) {
                console.error("Logotipo demasiado grande. Máximo 2MB");
                return;
              }
              const reader = new FileReader();
              reader.onloadend = () => setLogoPreview(reader.result as string);
              reader.readAsDataURL(file);
            }}
          />
          {schoolName && (
            <h1 className="font-heading text-xl font-bold text-foreground">
              {schoolName}
            </h1>
          )}
          <div className="hidden md:block h-8 w-px bg-foreground/10" />
          <h2 className="hidden md:block font-heading text-lg font-bold text-foreground">Definições</h2>
        </div>

        <div className="block md:hidden space-y-1 mb-4">
          <h2 className="font-heading text-lg font-bold text-foreground">Definições</h2>
        </div>

        {/* Grid layout */}
        <div className="md:grid md:grid-cols-12 md:gap-6 md:items-start">
          {/* Left column — setting cards */}
          <div className="md:col-span-3">
            <div className="flex flex-col gap-3 w-full">
              <button
                type="button"
                onClick={openProfile}
                className={`flex items-center justify-between rounded-xl bg-surface p-4 text-left transition-colors hover:bg-[#2A2A2A] active:scale-[0.99] ${selectedSection === "profile" ? "border-l-4 border-accent" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0 text-accent">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <div>
                    <p className="font-body text-sm font-semibold text-foreground">Perfil</p>
                    <p className="font-body text-[11px] text-text-secondary leading-tight">Nome, email e segurança</p>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-text-muted">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => { setShowCompany(true); setSelectedSection("company"); }}
                className={`flex items-center justify-between rounded-xl bg-surface p-4 text-left transition-colors hover:bg-[#2A2A2A] active:scale-[0.99] ${selectedSection === "company" ? "border-l-4 border-accent" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 shrink-0 ${selectedSection === "company" ? "text-accent" : "text-text-muted"}`}>
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <div>
                    <p className="font-body text-sm font-semibold text-foreground">Negócio</p>
                    <p className="font-body text-[11px] text-text-secondary leading-tight">Localização e descrição</p>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-text-muted">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => { setShowInstructors(true); setSelectedSection("instructors"); }}
                className={`flex items-center justify-between rounded-xl bg-surface p-4 text-left transition-colors hover:bg-[#2A2A2A] active:scale-[0.99] ${selectedSection === "instructors" ? "border-l-4 border-accent" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0 text-text-muted">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <div>
                    <p className="font-body text-sm font-semibold text-foreground">Instrutores</p>
                    <p className="font-body text-[11px] text-text-secondary leading-tight">Gerir equipa e horários</p>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-text-muted">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
              <Link
                href="/dashboard/mais-metricas"
                className="flex items-center justify-between rounded-xl bg-surface p-4 text-left transition-colors hover:bg-[#2A2A2A] active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0 text-text-muted">
                    <line x1="18" x2="18" y1="20" y2="10" />
                    <line x1="12" x2="12" y1="20" y2="4" />
                    <line x1="6" x2="6" y1="20" y2="14" />
                  </svg>
                  <div>
                    <p className="font-body text-sm font-semibold text-foreground">Métricas</p>
                    <p className="font-body text-[11px] text-text-secondary leading-tight">Analisar dados do negócio</p>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-text-muted">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
              <button
                type="button"
                onClick={() => { setShowSettings(true); setSelectedSection("settings"); }}
                className={`flex items-center justify-between rounded-xl bg-surface p-4 text-left transition-colors hover:bg-[#2A2A2A] active:scale-[0.99] ${selectedSection === "settings" ? "border-l-4 border-accent" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0 text-text-muted">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <div>
                    <p className="font-body text-sm font-semibold text-foreground">Definições</p>
                    <p className="font-body text-[11px] text-text-secondary leading-tight">Políticas, alertas e notificações</p>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-text-muted">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
              <Link
                href="/dashboard/mais-help"
                className="flex items-center justify-between rounded-xl bg-surface p-4 text-left transition-colors hover:bg-[#2A2A2A] active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0 text-text-muted">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <path d="M12 17h.01" />
                  </svg>
                  <div>
                    <p className="font-body text-sm font-semibold text-foreground">Apoio</p>
                    <p className="font-body text-[11px] text-text-secondary leading-tight">FAQ e suporte técnico</p>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-text-muted">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right column — desktop panel content */}
          <div className="hidden md:block md:col-span-9 md:h-[calc(100vh-10rem)] md:overflow-hidden">
            {!selectedSection && (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-text-muted mb-4">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </svg>
                <p className="font-body text-base text-text-secondary">Seleciona uma opção ao lado</p>
              </div>
            )}

            {selectedSection === "profile" && (
              <div className="rounded-xl bg-surface px-6 pt-6 pb-2 flex flex-col h-full overflow-hidden">
                <div className="flex items-center gap-4 mb-6 shrink-0">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-background text-xl font-bold text-accent">
                    {getInitials(profileName)}
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-foreground">Perfil</h3>
                    <p className="font-body text-sm text-text-secondary">Alterar nome, email e palavra-passe</p>
                  </div>
                </div>
                <div className="space-y-6 overflow-y-auto pr-1 flex-1 min-h-0">
                  <div>
                    <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Nome <span className="text-error">*</span></label>
                    <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="O teu nome" className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent" />
                  </div>
                  <div>
                    <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Email <span className="text-error">*</span></label>
                    <input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} placeholder="O teu email" className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent" />
                  </div>
                  <div>
                    <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Telemóvel <span className="text-error">*</span></label>
                    <input type="tel" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} placeholder="Telemóvel" className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Palavra-passe</label>
                      <input type="password" value={profilePassword} onChange={(e) => setProfilePassword(e.target.value)} placeholder="Nova palavra-passe" className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent" />
                    </div>
                    <div>
                      <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Confirmar palavra-passe</label>
                      <input type="password" value={profileConfirmPassword} onChange={(e) => setProfileConfirmPassword(e.target.value)} placeholder="Repetir palavra-passe" className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent" />
                      {profilePassword && profileConfirmPassword && profilePassword !== profileConfirmPassword && (
                        <p className="mt-1 font-body text-sm text-error">As palavras-passe não coincidem</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button type="button" onClick={() => setSelectedSection(null)} className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground">Fechar</button>
                    <button type="button" className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95">Guardar</button>
                  </div>
                </div>
              </div>
            )}

            {selectedSection === "company" && (
              <div className="rounded-xl bg-surface px-6 pt-6 pb-4 flex flex-col h-full overflow-hidden">
                <div className="flex items-center gap-4 mb-6 shrink-0">
                  {schoolLogoUrl ? (
                    <img src={schoolLogoUrl} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-background text-xl font-bold text-accent">
                      {schoolName?.charAt(0).toUpperCase() ?? "E"}
                    </div>
                  )}
                  <div>
                    <h3 className="font-heading text-xl font-bold text-foreground">Negócio</h3>
                    <p className="font-body text-sm text-text-secondary">Atualiza os dados do negócio</p>
                  </div>
                </div>
                <div className="space-y-6 overflow-y-auto pr-1 flex-1 min-h-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Nome do negócio <span className="text-error">*</span></label>
                      <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Nome da escola" className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent" />
                    </div>
                    <div>
                      <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Localização</label>
                      <input type="text" value={companyLocation} onChange={(e) => setCompanyLocation(e.target.value)} placeholder="Ex: Praia do Guincho, Cascais" className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent" />
                    </div>
                  </div>
                  <div>
                    <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Descrição</label>
                    <textarea value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} placeholder="Breve descrição da tua escola de surf" rows={4} className="w-full resize-none rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent" />
                  </div>
                  {/* Images gallery */}
                  <div className="pt-4 border-t border-foreground/10">
                    <p className="font-body text-sm font-semibold text-text-secondary mb-4">Imagens do negócio</p>
                    <p className="mb-4 text-center font-body text-sm text-text-secondary">{images.length} / 6 imagens</p>
                    {images.length < 6 && (
                    <div className="mb-6 flex justify-center">
                      <button type="button" onClick={() => imageFileRef.current?.click()} className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-text-muted bg-[#2A2A2A] transition-colors hover:border-accent hover:bg-accent/10">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-text-muted">
                          <line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" />
                        </svg>
                      </button>
                      <input ref={imageFileRef} type="file" accept="image/png,image/webp,image/jpeg" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !schoolId) return;
                        if (!["image/png", "image/webp", "image/jpeg"].includes(file.type)) { alert("Formato não permitido. Usa PNG, WebP ou JPEG."); return; }
                        if (file.size > 2048 * 1024) { alert("Imagem demasiado grande. Máximo 2MB."); return; }
                        const res = await addSchoolImage(schoolId, file);
                        if (!res.ok) { console.error("upload error:", res.error); return; }
                        const data = await getImages(schoolId);
                        setImages(data);
                      }} />
                    </div>
                    )}
                    {images.length === 0 ? (
                      <p className="py-8 text-center font-body text-sm text-text-secondary">Nenhuma imagem adicionada ainda</p>
                    ) : (
                      <div className="grid grid-cols-6 gap-6">
                        {images.map((img) => (
                          <div key={img.id} className="relative aspect-square overflow-hidden rounded-xl bg-[#2A2A2A]">
                            <button type="button" onClick={() => setLightboxImage(img.public_url)} className="h-full w-full">
                              <img src={img.public_url} alt="" className="h-full w-full object-cover" />
                            </button>
                            <button type="button" onClick={async () => { if (schoolId) { await deleteImage(img.id); const data = await getImages(schoolId); setImages(data); } }} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-error text-white shadow transition-transform active:scale-90">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                          </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-4 pt-2">
                    <button type="button" onClick={() => setSelectedSection(null)} className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground">Cancelar</button>
                    <button type="button" disabled={companySaving} onClick={async () => {
                      if (!schoolId) return;
                      setCompanySaving(true);
                      const res = await saveSchoolInfo(schoolId, { name: companyName, location: companyLocation, description: companyDescription });
                      if (res.ok) setSelectedSection(null);
                      setCompanySaving(false);
                    }} className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50">
                      {companySaving ? "A guardar..." : "Guardar"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedSection === "instructors" && (
              <div className="rounded-xl bg-surface px-6 pt-6 pb-2 flex flex-col h-full overflow-hidden">
                <h3 className="font-heading text-xl font-bold text-foreground mb-6 shrink-0">{editingInstrutorId !== null ? "Editar Instrutor" : "Instrutores"}</h3>
                <div className="overflow-y-auto pr-1 flex-1 min-h-0">
                <div className="mb-8 flex justify-center">
                  <button type="button" onClick={() => instrutorFileRef.current?.click()} className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-text-muted bg-[#2A2A2A] transition-colors hover:border-accent hover:bg-accent/10">
                    {instrutorFotoPreview ? (
                      <img src={instrutorFotoPreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-text-muted">
                        <line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" />
                      </svg>
                    )}
                  </button>
                  <input ref={instrutorFileRef} type="file" accept="image/png,image/webp,image/jpeg" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!["image/png", "image/webp", "image/jpeg"].includes(file.type)) { console.error("Formato não permitido. Usa PNG, WebP ou JPEG"); return; }
                    if (file.size > 2048 * 1024) { console.error("Foto demasiado grande. Máximo 2MB"); return; }
                    setInstrutorFotoFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => setInstrutorFotoPreview(reader.result as string);
                    reader.readAsDataURL(file);
                  }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {instrutorError && <p className="font-body text-sm text-error col-span-full">{instrutorError}</p>}
                  <div>
                    <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Nome do instrutor <span className="text-error">*</span></label>
                    <input type="text" value={instrutorNome} onChange={(e) => setInstrutorNome(e.target.value)} placeholder="Ex: João Silva" className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent" />
                  </div>
                  <div>
                    <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Nível do instrutor</label>
                    <input type="text" value={instrutorNivel} onChange={(e) => setInstrutorNivel(e.target.value)} placeholder="Ex: Instrutor sénior" className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent" />
                  </div>
                </div>
                {instrutores.length > 0 && (
                  <div className="mt-6">
                    <p className="font-body text-sm font-semibold text-text-secondary mb-3">Instrutores registados</p>
                    <div className="space-y-2">
                    {instrutores.map((inst) => (
                      <div key={inst.id} className="flex items-center gap-3 rounded-xl bg-[#2A2A2A] px-4 py-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-background text-sm font-bold text-accent">
                          {inst.avatar_url ? <img src={inst.avatar_url} alt="" className="h-full w-full object-cover" /> : inst.name.split(" ").map(p => p[0]).join("").substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm font-semibold text-foreground truncate">{inst.name}</p>
                          <p className="font-body text-xs text-text-secondary">Nível {inst.level || "—"}</p>
                        </div>
                        <button type="button" onClick={() => { setEditingInstrutorId(inst.id); setInstrutorNome(inst.name); setInstrutorNivel(inst.level); setInstrutorFotoPreview(null); setInstrutorFotoFile(null); }} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:text-accent">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                        </button>
                        <button type="button" onClick={async () => { if (!schoolId) return; const res = await deleteInstructor(schoolId, inst.id); if (res.ok) loadInstructors(); }} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:text-error">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  </div>
                )}
                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => { setSelectedSection(null); setInstrutorNome(""); setInstrutorNivel(""); setInstrutorFotoFile(null); setInstrutorFotoPreview(null); setEditingInstrutorId(null); }} className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground">Fechar</button>
                  <button type="button" disabled={instrutorSaving} onClick={async () => {
                    setInstrutorError("");
                    if (!instrutorNome.trim()) { setInstrutorError("O nome é obrigatório"); return; }
                    if (!schoolId) return;
                    setInstrutorSaving(true);
                    const fd = new FormData();
                    if (editingInstrutorId) fd.set("id", editingInstrutorId);
                    fd.set("name", instrutorNome.trim());
                    fd.set("level", instrutorNivel.trim());
                    if (instrutorFotoFile) fd.set("avatar", instrutorFotoFile);
                    const res = await saveInstructor(schoolId, null, fd);
                    if (res.ok) { setInstrutorNome(""); setInstrutorNivel(""); setInstrutorFotoFile(null); setInstrutorFotoPreview(null); setEditingInstrutorId(null); setInstrutorError(""); loadInstructors(); }
                    else { setInstrutorError(res.error ?? "Erro ao guardar"); }
                    setInstrutorSaving(false);
                  }} className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50">
                    {instrutorSaving ? "A guardar..." : editingInstrutorId !== null ? "Guardar" : "Adicionar"}
                  </button>
                </div>
              </div>
            </div>
            )}

            {selectedSection === "settings" && (
              <div className="rounded-xl bg-surface px-6 pt-6 pb-4 flex flex-col h-full overflow-hidden">
                <h3 className="font-heading text-xl font-bold text-foreground mb-6 shrink-0">Definições</h3>
                {settingsError && <p className="font-body text-sm text-error mb-4 shrink-0">{settingsError}</p>}
                <div className="space-y-8 overflow-y-auto pr-1 flex-1 min-h-0">
                  <div className="rounded-xl bg-[#2A2A2A] p-6">
                    <p className="font-heading text-base font-bold text-foreground mb-2">Política de cancelamento</p>
                    <p className="font-body text-sm text-text-secondary mb-4">Os alunos podem cancelar e receber crédito de volta até</p>
                    <div className="flex items-center gap-3 mb-3">
                      <input type="number" min={1} max={720} value={settings.cancellation_window_hours} onChange={(e) => setSettings((prev) => ({ ...prev, cancellation_window_hours: Number(e.target.value) }))} className="w-20 rounded-xl bg-surface px-4 py-3 text-center text-foreground outline-none focus:outline-2 focus:outline-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                      <span className="font-body text-sm text-text-secondary">horas antes da aula</span>
                    </div>
                    <div className="p-3 bg-surface rounded-xl space-y-1">
                      <p className="font-body text-xs text-text-secondary">• Se cancelar dentro deste prazo → <span className="text-success">crédito devolvido</span></p>
                      <p className="font-body text-xs text-text-secondary">• Se cancelar depois → <span className="text-error">crédito não devolvido</span></p>
                    </div>
                    <div className="border-t border-foreground/10 pt-6 mt-6">
                      <p className="font-heading text-base font-bold text-foreground mb-2">Threshold de alertas</p>
                      <p className="font-body text-sm text-text-secondary mb-4">Mostrar alerta de baixa ocupação quando a sessão tiver menos de</p>
                      <div className="flex items-center gap-3">
                        <input type="number" min={1} max={100} value={settings.low_occupancy_threshold} onChange={(e) => setSettings((prev) => ({ ...prev, low_occupancy_threshold: Number(e.target.value) }))} className="w-20 rounded-xl bg-surface px-4 py-3 text-center text-foreground outline-none focus:outline-2 focus:outline-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                        <span className="font-body text-sm text-text-secondary">% de capacidade</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#2A2A2A] p-6">
                    <p className="font-heading text-base font-bold text-foreground mb-4">Notificações</p>
                    <div className="space-y-4">
                      {[
                        { key: "notify_email_confirmation" as const, label: "Email de confirmação de reserva" },
                        { key: "notify_reminder_24h" as const, label: "Lembrete 24h antes da aula" },
                        { key: "notify_sms_cancellation" as const, label: "SMS de cancelamento" },
                        { key: "notify_new_schedule" as const, label: "Novos horários aos alunos" },
                      ].map((item) => (
                        <label key={item.key} className="flex items-center justify-between py-1">
                          <span className="font-body text-sm text-foreground">{item.label}</span>
                          <button type="button" onClick={() => setSettings((prev) => ({ ...prev, [item.key]: !prev[item.key] }))} className={`relative h-6 w-11 rounded-full transition-colors ${settings[item.key] ? "bg-accent" : "bg-[#2A2A2A]"}`}>
                            <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${settings[item.key] ? "translate-x-5" : ""}`} />
                          </button>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button type="button" onClick={() => setSelectedSection(null)} className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground">Cancelar</button>
                    <button type="button" disabled={settingsSaving} onClick={async () => {
                      if (!schoolId) return;
                      setSettingsError("");
                      setSettingsSaving(true);
                      const res = await saveSchoolSettings(schoolId, settings);
                      if (res.ok) { setSelectedSection(null); }
                      else { setSettingsError(res.error ?? "Erro ao guardar definições"); }
                      setSettingsSaving(false);
                    }} className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50">
                      {settingsSaving ? "A guardar..." : "Guardar"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Info — mobile only */}
        <div className="mt-8 space-y-4 md:hidden">
          <h2 className="font-heading text-lg font-bold text-foreground">Conta</h2>
          <div className="rounded-xl bg-surface px-5 py-4">
            <p className="font-body text-sm text-text-secondary">Versão da app</p>
            <p className="font-body text-base text-foreground">1.0.0</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              const { logoutOwner } = await import("../../actions");
              await logoutOwner();
              window.location.href = "/";
            }}
            className="w-full rounded-xl bg-error/20 py-3 font-body text-sm font-semibold text-error transition-colors hover:bg-error/30"
          >
            Terminar sessão
          </button>
        </div>
      </main>

      {showProfile && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 md:hidden" onClick={() => setShowProfile(false)}>
          <div className="w-full max-w-md rounded-t-2xl bg-surface p-6 pb-24 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-muted" />

            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-background text-xl font-bold text-accent">
                {getInitials(profileName)}
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-foreground">Editar Perfil</h3>
                <p className="font-body text-sm text-text-secondary">Atualiza os teus dados</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Nome <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="O teu nome"
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                />
              </div>

              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Email <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="O teu email"
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                />
              </div>

              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Telemóvel <span className="text-error">*</span>
                </label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="Telemóvel"
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                />
              </div>

              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Palavra-passe <span className="text-text-muted"></span>
                </label>
                <input
                  type="password"
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                  placeholder="Nova palavra-passe"
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                />
              </div>

              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Confirmar palavra-passe <span className="text-text-muted"></span>
                </label>
                <input
                  type="password"
                  value={profileConfirmPassword}
                  onChange={(e) => setProfileConfirmPassword(e.target.value)}
                  placeholder="Repetir nova palavra-passe"
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                />
                {profilePassword && profileConfirmPassword && profilePassword !== profileConfirmPassword && (
                  <p className="mt-1 font-body text-sm text-error">As palavras-passe não coincidem</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProfile(false)}
                  className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company Modal */}
      {showCompany && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 md:hidden" onClick={() => setShowCompany(false)}>
          <div className="w-full max-w-md rounded-t-2xl bg-surface p-6 pb-24 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-muted" />

            <div className="flex items-center gap-4 mb-6">
              {schoolLogoUrl ? (
                <img src={schoolLogoUrl} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-background text-xl font-bold text-accent">
                  {schoolName?.charAt(0).toUpperCase() ?? "E"}
                </div>
              )}
              <div>
                <h3 className="font-heading text-xl font-bold text-foreground">Editar Empresa</h3>
                <p className="font-body text-sm text-text-secondary">Atualiza os dados do negócio</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Nome do negócio <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Nome da escola"
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                />
              </div>

              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Localização
                </label>
                <input
                  type="text"
                  value={companyLocation}
                  onChange={(e) => setCompanyLocation(e.target.value)}
                  placeholder="Ex: Praia do Guincho, Cascais"
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                />
              </div>

              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Descrição
                </label>
                <textarea
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Breve descrição da tua escola de surf"
                  rows={4}
                  className="w-full resize-none rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                />
              </div>

              {/* Images gallery */}
              <div className="pt-4 border-t border-foreground/10">
                <p className="font-body text-sm font-semibold text-text-secondary mb-4">Imagens do negócio</p>
                <p className="mb-4 text-center font-body text-sm text-text-secondary">
                  {images.length} / 6 imagens
                </p>

                {images.length < 6 && (
                <div className="mb-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => imageFileRef.current?.click()}
                    className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-text-muted bg-[#2A2A2A] transition-colors hover:border-accent hover:bg-accent/10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-text-muted">
                      <line x1="12" x2="12" y1="5" y2="19" />
                      <line x1="5" x2="19" y1="12" y2="12" />
                    </svg>
                  </button>
                  <input
                    ref={imageFileRef}
                    type="file"
                    accept="image/png,image/webp,image/jpeg"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !schoolId) return;
                      if (!["image/png", "image/webp", "image/jpeg"].includes(file.type)) {
                        alert("Formato não permitido. Usa PNG, WebP ou JPEG.");
                        return;
                      }
                      if (file.size > 2048 * 1024) {
                        alert("Imagem demasiado grande. Máximo 2MB.");
                        return;
                      }
                      const res = await addSchoolImage(schoolId, file);
                      if (!res.ok) { console.error("upload error:", res.error); return; }
                      const data = await getImages(schoolId);
                      setImages(data);
                    }}
                  />
                </div>
                )}

                {images.length === 0 ? (
                  <p className="py-8 text-center font-body text-sm text-text-secondary">
                    Nenhuma imagem adicionada ainda
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img) => (
                      <div key={img.id} className="relative aspect-square overflow-hidden rounded-xl bg-[#2A2A2A]">
                        <button
                          type="button"
                          onClick={() => setLightboxImage(img.public_url)}
                          className="h-full w-full"
                        >
                          <img
                            src={img.public_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (schoolId) {
                              await deleteImage(img.id);
                              const data = await getImages(schoolId);
                              setImages(data);
                            }
                          }}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-error text-white shadow transition-transform active:scale-90"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompany(false)}
                  className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={companySaving}
                  onClick={async () => {
                    if (!schoolId) return;
                    setCompanySaving(true);
                    const res = await saveSchoolInfo(schoolId, {
                      name: companyName,
                      location: companyLocation,
                      description: companyDescription,
                    });
                    if (res.ok) setShowCompany(false);
                    setCompanySaving(false);
                  }}
                  className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
                >
                  {companySaving ? "A guardar..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 md:hidden" onClick={() => setShowSettings(false)}>
          <div className="w-full max-w-md rounded-t-2xl bg-surface p-6 pb-24 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-muted" />

            <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Definições</h3>

            {settingsError && <p className="font-body text-sm text-error mb-4">{settingsError}</p>}

            {/* Política de cancelamento */}
            <div className="mb-6">
              <p className="font-heading text-base font-bold text-foreground mb-2">Política de cancelamento</p>
              <p className="font-body text-sm text-text-secondary mb-4">
                Os alunos podem cancelar e receber crédito de volta até
              </p>
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="number"
                  min={1}
                  max={720}
                  value={settings.cancellation_window_hours}
                  onChange={(e) => setSettings((prev) => ({ ...prev, cancellation_window_hours: Number(e.target.value) }))}
                  className="w-20 rounded-xl bg-[#2A2A2A] px-4 py-3 text-center text-foreground outline-none focus:outline-2 focus:outline-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="font-body text-sm text-text-secondary">horas antes da aula</span>
              </div>
              <div className="rounded-xl bg-[#2A2A2A] p-3 space-y-1">
                <p className="font-body text-xs text-text-secondary">
                  • Se cancelar dentro deste prazo → <span className="text-success">crédito devolvido</span>
                </p>
                <p className="font-body text-xs text-text-secondary">
                  • Se cancelar depois → <span className="text-error">crédito não devolvido</span>
                </p>
              </div>
            </div>

            <div className="h-px bg-foreground/10 my-6" />

            {/* Threshold de alertas */}
            <div className="mb-6">
              <p className="font-heading text-base font-bold text-foreground mb-2">Threshold de alertas</p>
              <p className="font-body text-sm text-text-secondary mb-4">
                Mostrar alerta de baixa ocupação quando a sessão tiver menos de
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={settings.low_occupancy_threshold}
                  onChange={(e) => setSettings((prev) => ({ ...prev, low_occupancy_threshold: Number(e.target.value) }))}
                  className="w-20 rounded-xl bg-[#2A2A2A] px-4 py-3 text-center text-foreground outline-none focus:outline-2 focus:outline-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="font-body text-sm text-text-secondary">% de capacidade</span>
              </div>
            </div>

            <div className="h-px bg-foreground/10 my-6" />

            {/* Notificações */}
            <div className="mb-6">
              <p className="font-heading text-base font-bold text-foreground mb-4">Notificações</p>
              <div className="space-y-4">
                {[
                  { key: "notify_email_confirmation" as const, label: "Email de confirmação de reserva" },
                  { key: "notify_reminder_24h" as const, label: "Lembrete 24h antes da aula" },
                  { key: "notify_sms_cancellation" as const, label: "SMS de cancelamento" },
                  { key: "notify_new_schedule" as const, label: "Novos horários aos alunos" },
                ].map((item) => (
                  <label key={item.key} className="flex items-center justify-between py-1">
                    <span className="font-body text-sm text-foreground">{item.label}</span>
                    <button
                      type="button"
                      onClick={() => setSettings((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className={`relative h-6 w-11 rounded-full transition-colors ${settings[item.key] ? "bg-accent" : "bg-[#2A2A2A]"}`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${settings[item.key] ? "translate-x-5" : ""}`}
                      />
                    </button>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={settingsSaving}
                onClick={async () => {
                  if (!schoolId) return;
                  setSettingsError("");
                  setSettingsSaving(true);
                  const res = await saveSchoolSettings(schoolId, settings);
                  if (res.ok) {
                    setShowSettings(false);
                  } else {
                    setSettingsError(res.error ?? "Erro ao guardar definições");
                  }
                  setSettingsSaving(false);
                }}
                className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
              >
                {settingsSaving ? "A guardar..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instrutor Modal */}
      {showInstructors && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 md:hidden" onClick={() => setShowInstructors(false)}>
          <div className="w-full max-w-md rounded-t-2xl bg-surface p-6 pb-24 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-muted" />

            <h3 className="font-heading text-2xl font-bold text-foreground mb-6">{editingInstrutorId !== null ? "Editar Instrutor" : "Adicionar Instrutor"}</h3>

            {/* Avatar upload circle — centered */}
            <div className="mb-8 flex justify-center">
              <button
                type="button"
                onClick={() => instrutorFileRef.current?.click()}
                className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-text-muted bg-[#2A2A2A] transition-colors hover:border-accent hover:bg-accent/10"
              >
                {instrutorFotoPreview ? (
                  <img src={instrutorFotoPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-text-muted">
                    <line x1="12" x2="12" y1="5" y2="19" />
                    <line x1="5" x2="19" y1="12" y2="12" />
                  </svg>
                )}
              </button>
              <input
                ref={instrutorFileRef}
                type="file"
                accept="image/png,image/webp,image/jpeg"
                className="hidden"
                 onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!["image/png", "image/webp", "image/jpeg"].includes(file.type)) {
                    console.error("Formato não permitido. Usa PNG, WebP ou JPEG");
                    return;
                  }
                  if (file.size > 2048 * 1024) {
console.error("Foto demasiado grande. Máximo 2MB");
                    return;
                  }
                  setInstrutorFotoFile(file);
                  const reader = new FileReader();
                  reader.onloadend = () => setInstrutorFotoPreview(reader.result as string);
                  reader.readAsDataURL(file);
                }}
              />
            </div>

            {/* Inputs below */}
            <div className="space-y-4">
              {instrutorError && <p className="font-body text-sm text-error">{instrutorError}</p>}
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Nome do instrutor <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={instrutorNome}
                  onChange={(e) => setInstrutorNome(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                />
              </div>
              <div>
                <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">
                  Nível do instrutor
                </label>
                <input
                  type="text"
                  value={instrutorNivel}
                  onChange={(e) => setInstrutorNivel(e.target.value)}
                  placeholder="Ex: Instrutor sénior"
                  className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                />
              </div>
            </div>

            {/* Instrutores list */}
            {instrutores.length > 0 && (
              <div className="mt-6 space-y-2">
                {instrutores.map((inst, i) => (
                  <div key={inst.id} className="flex items-center gap-3 rounded-xl bg-[#2A2A2A] px-4 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-background text-sm font-bold text-accent">
                      {inst.avatar_url ? (
                        <img src={inst.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        inst.name.split(" ").map(p => p[0]).join("").substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-semibold text-foreground truncate">{inst.name}</p>
                      <p className="font-body text-xs text-text-secondary">Nível {inst.level || "—"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingInstrutorId(inst.id);
                        setInstrutorNome(inst.name);
                        setInstrutorNivel(inst.level);
                        setInstrutorFotoPreview(null);
                        setInstrutorFotoFile(null);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:text-accent"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!schoolId) return;
                        const res = await deleteInstructor(schoolId, inst.id);
                        if (res.ok) loadInstructors();
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:text-error"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={() => {
                  setShowInstructors(false);
                  setInstrutorNome("");
                  setInstrutorNivel("");
                  setInstrutorFotoFile(null);
                  setInstrutorFotoPreview(null);
                  setEditingInstrutorId(null);
                }}
                className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
              >
                Fechar
              </button>
              <button
                type="button"
                disabled={instrutorSaving}
                onClick={async () => {
                  setInstrutorError("");
                  if (!instrutorNome.trim()) { setInstrutorError("O nome é obrigatório"); return; }
                  if (!schoolId) return;
                  setInstrutorSaving(true);
                  const fd = new FormData();
                  if (editingInstrutorId) fd.set("id", editingInstrutorId);
                  fd.set("name", instrutorNome.trim());
                  fd.set("level", instrutorNivel.trim());
                  if (instrutorFotoFile) fd.set("avatar", instrutorFotoFile);
                  const res = await saveInstructor(schoolId, null, fd);
                  if (res.ok) {
                    setInstrutorNome("");
                    setInstrutorNivel("");
                    setInstrutorFotoFile(null);
                    setInstrutorFotoPreview(null);
                    setEditingInstrutorId(null);
                    setInstrutorError("");
                    loadInstructors();
                  } else {
                    setInstrutorError(res.error ?? "Erro ao guardar");
                  }
                  setInstrutorSaving(false);
                }}
                className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
              >
                {instrutorSaving ? "A guardar..." : editingInstrutorId !== null ? "Guardar" : "Adicionar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-5"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
          <img
            src={lightboxImage}
            alt=""
            className="max-h-[90vh] max-w-full rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
