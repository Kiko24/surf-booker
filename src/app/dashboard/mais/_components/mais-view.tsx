"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { addSchoolImage, deleteImage, getImages, saveInstructor, deleteInstructor, getInstructors, getSchoolSettings, saveSchoolSettings, saveSchoolInfo, saveProfile, saveSchoolLogo, getWaiverVersions, getWaiverAcceptances, saveWaiverVersion, type SchoolImage, type Instructor, type SchoolSettings, type WaiverVersion, type WaiverAcceptanceRow } from "../actions";
import { getMaisData } from "../../actions";

type Props = {
  schoolId: string | null;
};

export function MaisView({ schoolId }: Props) {
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [schoolLogoUrl, setSchoolLogoUrl] = useState<string | null>(null);
  const [schoolLocation, setSchoolLocation] = useState<string | null>(null);
  const [schoolDescription, setSchoolDescription] = useState<string | null>(null);
  const [schoolPhone, setSchoolPhone] = useState<string | null>(null);
  const [cancellationWindowHours, setCancellationWindowHours] = useState(24);
  const [loadingMais, setLoadingMais] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [profileConfirmPassword, setProfileConfirmPassword] = useState("");
  const [showCompany, setShowCompany] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyLocation, setCompanyLocation] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");

  useEffect(() => {
    if (!schoolId) return;
    setLoadingMais(true);
    getMaisData().then((d) => {
      setFullName(d.fullName);
      setEmail(d.email);
      setPhone(d.phone);
      setSchoolName(d.schoolInfo?.name ?? null);
      setSchoolLogoUrl(d.schoolInfo?.logo_url ?? null);
      setSchoolLocation(d.schoolInfo?.location ?? null);
      setSchoolDescription(d.schoolInfo?.description ?? null);
      setSchoolPhone(d.schoolInfo?.phone ?? null);
      setCancellationWindowHours(d.schoolInfo?.cancellation_window_hours ?? 24);
      setProfileName(d.fullName);
      setProfileEmail(d.email);
      setProfilePhone(d.phone);
      setCompanyName(d.schoolInfo?.name ?? "");
      setCompanyLocation(d.schoolInfo?.location ?? "");
      setCompanyDescription(d.schoolInfo?.description ?? "");
      setCompanyPhone(d.schoolInfo?.phone ?? "");
    }).finally(() => setLoadingMais(false));
  }, [schoolId]);
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

  const [images, setImages] = useState<SchoolImage[]>([]);

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
    terms_url: "",
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [showWaivers, setShowWaivers] = useState(false);
  const [waiverVersions, setWaiverVersions] = useState<WaiverVersion[]>([]);
  const [waiverTitle, setWaiverTitle] = useState("");
  const [waiverBody, setWaiverBody] = useState("");
  const [waiverSaving, setWaiverSaving] = useState(false);
  const [waiverError, setWaiverError] = useState("");
  const [waiverAcceptances, setWaiverAcceptances] = useState<WaiverAcceptanceRow[]>([]);
  const [showWaiverAcceptances, setShowWaiverAcceptances] = useState<string | null>(null);

  const [companySaving, setCompanySaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");

  useEffect(() => {
    if (showSettings && schoolId) {
      getSchoolSettings(schoolId).then((s) => {
        if (s) setSettings(s);
      });
    }
  }, [showSettings, schoolId]);

  const loadWaivers = useCallback(async () => {
    if (!schoolId) return;
    const versions = await getWaiverVersions(schoolId);
    setWaiverVersions(versions);
    const active = versions.find((v) => v.is_active);
    if (active) {
      setWaiverTitle(active.title);
      setWaiverBody(active.body);
    } else {
      setWaiverTitle("");
      setWaiverBody("");
    }
  }, [schoolId]);

  useEffect(() => {
    if ((showWaivers || selectedSection === "waivers") && schoolId) {
      const id = requestAnimationFrame(() => loadWaivers());
      return () => cancelAnimationFrame(id);
    }
  }, [showWaivers, selectedSection, schoolId, loadWaivers]);

  const tabSections = ["profile", "company", "instructors", "waivers", "settings"];

  const handleTabKeyDown = (e: React.KeyboardEvent, section: string) => {
    const idx = tabSections.indexOf(section);
    let newIdx: number | null = null;
    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        newIdx = (idx + 1) % tabSections.length;
        break;
      case "ArrowUp":
      case "ArrowLeft":
        newIdx = (idx - 1 + tabSections.length) % tabSections.length;
        break;
      case "Home":
        newIdx = 0;
        break;
      case "End":
        newIdx = tabSections.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    const next = tabSections[newIdx];
    setSelectedSection(next);
    const btn = document.querySelector<HTMLButtonElement>(`[role="tab"][data-section="${next}"]`);
    btn?.focus();
  };

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
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || !schoolId) return;
              if (!["image/png", "image/webp", "image/jpeg"].includes(file.type)) {
                setLogoError("Formato não permitido. Usa PNG, WebP ou JPEG");
                return;
              }
              if (file.size > 2 * 1024 * 1024) {
                setLogoError("Logotipo demasiado grande. Máximo 2MB");
                return;
              }
              const reader = new FileReader();
              reader.onloadend = () => setLogoPreview(reader.result as string);
              reader.readAsDataURL(file);
              setLogoError("");
              setLogoUploading(true);
              const res = await saveSchoolLogo(schoolId, file);
              setLogoUploading(false);
              if (!res.ok) {
                setLogoError(res.error ?? "Erro ao guardar logotipo");
                setLogoPreview(null);
              }
            }}
          />
          {logoUploading && (
            <p className="font-body text-xs text-text-muted">A carregar logotipo...</p>
          )}
          {logoError && (
            <p className="font-body text-xs text-error">{logoError}</p>
          )}
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
          <div className="md:col-span-3 min-h-[50vh] flex flex-col justify-center md:min-h-[65vh] 2xl:min-h-0 2xl:block">
            <div
              role="tablist"
              aria-label="Definições"
              className="flex flex-col gap-3 w-full"
            >
              <button
                role="tab"
                data-section="profile"
                type="button"
                aria-selected={selectedSection === "profile"}
                aria-controls="panel-profile"
                id="tab-profile"
                onClick={openProfile}
                onKeyDown={(e) => handleTabKeyDown(e, "profile")}
                tabIndex={selectedSection === "profile" ? 0 : -1}
                className={`flex items-center justify-between rounded-xl bg-surface p-4 text-left transition-colors hover:bg-[#2A2A2A] active:scale-[0.99] ${selectedSection === "profile" ? "border-l-4 border-accent" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 shrink-0 ${selectedSection === "profile" ? "text-accent" : "text-text-muted"}`}>
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
                role="tab"
                data-section="company"
                type="button"
                aria-selected={selectedSection === "company"}
                aria-controls="panel-company"
                id="tab-company"
                onClick={() => { setShowCompany(true); setSelectedSection("company"); }}
                onKeyDown={(e) => handleTabKeyDown(e, "company")}
                tabIndex={selectedSection === "company" ? 0 : -1}
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
                role="tab"
                data-section="instructors"
                type="button"
                aria-selected={selectedSection === "instructors"}
                aria-controls="panel-instructors"
                id="tab-instructors"
                onClick={() => { setShowInstructors(true); setSelectedSection("instructors"); }}
                onKeyDown={(e) => handleTabKeyDown(e, "instructors")}
                tabIndex={selectedSection === "instructors" ? 0 : -1}
                className={`flex items-center justify-between rounded-xl bg-surface p-4 text-left transition-colors hover:bg-[#2A2A2A] active:scale-[0.99] ${selectedSection === "instructors" ? "border-l-4 border-accent" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 shrink-0 ${selectedSection === "instructors" ? "text-accent" : "text-text-muted"}`}>
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
              <button
                role="tab"
                data-section="waivers"
                type="button"
                aria-selected={selectedSection === "waivers"}
                aria-controls="panel-waivers"
                id="tab-waivers"
                onClick={() => { setShowWaivers(true); setSelectedSection("waivers"); }}
                onKeyDown={(e) => handleTabKeyDown(e, "waivers")}
                tabIndex={selectedSection === "waivers" ? 0 : -1}
                className={`flex items-center justify-between rounded-xl bg-surface p-4 text-left transition-colors hover:bg-[#2A2A2A] active:scale-[0.99] ${selectedSection === "waivers" ? "border-l-4 border-accent" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 shrink-0 ${selectedSection === "waivers" ? "text-accent" : "text-text-muted"}`}>
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" x2="8" y1="13" y2="13" />
                    <line x1="16" x2="8" y1="17" y2="17" />
                  </svg>
                  <div>
                    <p className="font-body text-sm font-semibold text-foreground">Waivers</p>
                    <p className="font-body text-[11px] text-text-secondary leading-tight">Gerir termos e aceitações</p>
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
                role="tab"
                data-section="settings"
                type="button"
                aria-selected={selectedSection === "settings"}
                aria-controls="panel-settings"
                id="tab-settings"
                onClick={() => { setShowSettings(true); setSelectedSection("settings"); }}
                onKeyDown={(e) => handleTabKeyDown(e, "settings")}
                tabIndex={selectedSection === "settings" ? 0 : -1}
                className={`flex items-center justify-between rounded-xl bg-surface p-4 text-left transition-colors hover:bg-[#2A2A2A] active:scale-[0.99] ${selectedSection === "settings" ? "border-l-4 border-accent" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 shrink-0 ${selectedSection === "settings" ? "text-accent" : "text-text-muted"}`}>
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
          <div className="max-md:hidden md:col-span-9 md:h-[calc(100vh-10rem)]">
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
              <div
                role="tabpanel"
                id="panel-profile"
                aria-labelledby="tab-profile"
                tabIndex={0}
                className="rounded-xl bg-surface px-6 pt-6 pb-2 flex flex-col h-full"
              >
                <div className="flex items-center gap-4 mb-6 shrink-0 pl-3">
                  <div>
                    <h3 className="font-heading text-xl font-bold text-foreground">Perfil</h3>
                    <p className="font-body text-sm text-text-secondary">Alterar nome, email e palavra-passe</p>
                  </div>
                </div>
                <div className="space-y-6 overflow-y-auto flex-1 min-h-0 pl-3 pr-3">
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
                      <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Palavra-passe <span className="text-text-muted">(opcional)</span></label>
                      <input type="password" value={profilePassword} onChange={(e) => setProfilePassword(e.target.value)} placeholder="Nova palavra-passe" className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent" />
                    </div>
                    <div>
                      <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Confirmar <span className="text-text-muted">(opcional)</span></label>
                      <input type="password" value={profileConfirmPassword} onChange={(e) => setProfileConfirmPassword(e.target.value)} placeholder="Repetir palavra-passe" className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent" />
                      {profilePassword && profileConfirmPassword && profilePassword !== profileConfirmPassword && (
                        <p className="mt-1 font-body text-sm text-error">As palavras-passe não coincidem</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button type="button" onClick={() => { setSelectedSection(null); setProfileError(""); }} className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground">Fechar</button>
                    <button type="button" disabled={profileSaving} onClick={async () => {
                      setProfileError("");
                      if (profilePassword && profilePassword !== profileConfirmPassword) { setProfileError("As palavras-passe não coincidem"); return; }
                      setProfileSaving(true);
                      const res = await saveProfile({ name: profileName, email: profileEmail, phone: profilePhone, password: profilePassword || undefined });
                      setProfileSaving(false);
                      if (!res.ok) { setProfileError(res.error ?? "Erro ao guardar"); return; }
                      setSelectedSection(null);
                    }} className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50">
                      {profileSaving ? "A guardar..." : "Guardar"}
                    </button>
                  </div>
                  {profileError && <p className="font-body text-sm text-error mt-2">{profileError}</p>}
                </div>
              </div>
            )}

            {selectedSection === "company" && (
              <div
                role="tabpanel"
                id="panel-company"
                aria-labelledby="tab-company"
                tabIndex={0}
                className="rounded-xl bg-surface px-6 pt-6 pb-4 flex flex-col h-full"
              >
                <div className="flex items-center gap-4 mb-6 shrink-0 pl-3">
                  <div>
                    <h3 className="font-heading text-xl font-bold text-foreground">Negócio</h3>
                    <p className="font-body text-sm text-text-secondary">Atualiza os dados do negócio</p>
                  </div>
                </div>
                <div className="space-y-6 overflow-y-auto flex-1 min-h-0 pl-3 pr-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Nome do negócio <span className="text-error">*</span></label>
                      <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Nome da escola" className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent focus:outline-offset-[-2px]" />
                    </div>
                    <div>
                      <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Localização</label>
                      <input type="text" value={companyLocation} onChange={(e) => setCompanyLocation(e.target.value)} placeholder="Ex: Praia do Guincho, Cascais" className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent" />
                    </div>
                    <div>
                      <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Contacto (WhatsApp)</label>
                      <input type="text" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="+351 9XXXXXXXX" className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent" />
                    </div>
                  </div>
                  <div>
                    <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Descrição</label>
                    <textarea value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} placeholder="Breve descrição da tua escola de surf" rows={2} className="w-full resize-none rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent focus:outline-offset-[-2px]" />
                  </div>
                  {/* Images gallery */}
                  <div className="pt-4 border-t border-foreground/10">
                    <p className="font-body text-sm font-semibold text-text-secondary mb-4">Imagens do negócio</p>
                    <p className="mb-4 text-center font-body text-sm text-text-secondary">{images.length} / 6 imagens</p>
                    {images.length < 6 && (
                    <div className="mb-6 flex justify-center">
                      <button type="button" onClick={() => imageFileRef.current?.click()} aria-label="Adicionar imagem" className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-text-muted bg-[#2A2A2A] transition-colors hover:border-accent hover:bg-accent/10">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-text-muted">
                          <line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" />
                        </svg>
                      </button>
                      <input ref={imageFileRef} type="file" accept="image/png,image/webp,image/jpeg" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !schoolId) return;
                        if (!["image/png", "image/webp", "image/jpeg"].includes(file.type)) { alert("Formato não permitido. Usa PNG, WebP ou JPEG."); return; }
                        if (file.size > 2 * 1024 * 1024) { alert("Imagem demasiado grande. Máximo 2MB."); return; }
                        const res = await addSchoolImage(schoolId, file);
                        if (!res.ok) { console.error("upload error:", res.error); return; }
                        const data = await getImages(schoolId);
                        setImages(data);
                      }} />
                    </div>
                    )}
                    {images.length === 0 ? (
                      <p className="py-4 text-center font-body text-sm text-text-secondary">Nenhuma imagem adicionada ainda</p>
                    ) : (
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {images.map((img) => (
                          <div key={img.id} className="relative aspect-square overflow-hidden rounded-xl bg-[#2A2A2A]">
                            <button type="button" onClick={() => setLightboxImage(img.public_url)} className="h-full w-full">
                              <img src={img.public_url} alt="" className="h-full w-full object-cover" />
                            </button>
                            <button type="button" aria-label="Eliminar imagem" onClick={async () => { if (schoolId) { await deleteImage(img.id); const data = await getImages(schoolId); setImages(data); } }} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-error text-white shadow transition-transform active:scale-90">
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
                      const res = await saveSchoolInfo(schoolId, { name: companyName, location: companyLocation, description: companyDescription, phone: companyPhone });
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
              <div
                role="tabpanel"
                id="panel-instructors"
                aria-labelledby="tab-instructors"
                tabIndex={0}
                className="rounded-xl bg-surface px-6 pt-6 pb-2 flex flex-col h-full"
              >
                <h3 className="font-heading text-xl font-bold text-foreground mb-6 shrink-0 pl-3">{editingInstrutorId !== null ? "Editar Instrutor" : "Instrutores"}</h3>
                <div className="overflow-y-auto flex-1 min-h-0 pl-3 pr-3">
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
                  <label htmlFor="instrutor-foto" className="sr-only">Foto do instrutor</label>
                  <input ref={instrutorFileRef} id="instrutor-foto" type="file" accept="image/png,image/webp,image/jpeg" className="hidden" onChange={(e) => {
                    setInstrutorError("");
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!["image/png", "image/webp", "image/jpeg"].includes(file.type)) { setInstrutorError("Formato não permitido. Usa PNG, WebP ou JPEG"); return; }
                    if (file.size > 1024 * 1024) { setInstrutorError(`Foto demasiado grande. Máximo ${(1024 * 1024) / (1024 * 1024)}MB`); return; }
                    setInstrutorFotoFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => setInstrutorFotoPreview(reader.result as string);
                    reader.readAsDataURL(file);
                  }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                        <button type="button" aria-label="Editar instrutor" onClick={() => { setEditingInstrutorId(inst.id); setInstrutorNome(inst.name); setInstrutorNivel(inst.level); setInstrutorFotoPreview(null); setInstrutorFotoFile(null); }} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:text-accent">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                        </button>
                        <button type="button" aria-label="Eliminar instrutor" onClick={async () => { if (!schoolId) return; const res = await deleteInstructor(schoolId, inst.id); if (res.ok) loadInstructors(); }} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:text-error">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  </div>
                )}
                {instrutorError && (
                  <div className="flex items-center gap-2 rounded-xl bg-error/10 px-4 py-3 mt-4">
                    <svg className="h-4 w-4 shrink-0 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="font-body text-sm text-error">{instrutorError}</p>
                  </div>
                )}
                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => { setSelectedSection(null); setInstrutorNome(""); setInstrutorNivel(""); setInstrutorFotoFile(null); setInstrutorFotoPreview(null); setEditingInstrutorId(null); setInstrutorError(""); }} className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground">Fechar</button>
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
              <div
                role="tabpanel"
                id="panel-settings"
                aria-labelledby="tab-settings"
                tabIndex={0}
                className="rounded-xl bg-surface px-6 pt-6 pb-4 flex flex-col h-full"
              >
                <h3 className="font-heading text-xl font-bold text-foreground mb-6 shrink-0 pl-3">Definições</h3>
                {settingsError && <p className="font-body text-sm text-error mb-4 shrink-0 pl-3">{settingsError}</p>}
                <div className="space-y-8 overflow-y-auto flex-1 min-h-0 pl-3 pr-3">
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
                    <p className="font-heading text-base font-bold text-foreground mb-2">Termos e Condições</p>
                    <p className="font-body text-sm text-text-secondary mb-4">Link para os termos e condições da escola (aparece no checkbox da reserva pública)</p>
                    <input
                      type="url"
                      value={settings.terms_url ?? ""}
                      onChange={(e) => setSettings((prev) => ({ ...prev, terms_url: e.target.value || null }))}
                      className="w-full rounded-xl bg-surface px-4 py-3 text-sm text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                      placeholder="https://exemplo.com/termos"
                    />
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

            {selectedSection === "waivers" && (
              <div
                role="tabpanel"
                id="panel-waivers"
                aria-labelledby="tab-waivers"
                tabIndex={0}
                className="rounded-xl bg-surface px-6 pt-6 pb-4 flex flex-col h-full"
              >
                <h3 className="font-heading text-xl font-bold text-foreground mb-6 shrink-0 pl-3">Waivers</h3>
                <div className="space-y-6 overflow-y-auto flex-1 min-h-0 pl-3 pr-3">
                  <div>
                    <p className="font-body text-sm font-semibold text-text-secondary mb-1">Título do waiver</p>
                    <input
                      type="text"
                      value={waiverTitle}
                      onChange={(e) => setWaiverTitle(e.target.value)}
                      placeholder="Ex: Termos de responsabilidade"
                      maxLength={150}
                      className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                    />
                  </div>
                  <div>
                    <p className="font-body text-sm font-semibold text-text-secondary mb-1">Texto do waiver</p>
                    <textarea
                      value={waiverBody}
                      onChange={(e) => setWaiverBody(e.target.value)}
                      placeholder="Escreve aqui os termos que os alunos devem aceitar..."
                      rows={8}
                      maxLength={20000}
                      className="w-full resize-none rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
                    />
                  </div>
                  {waiverError && <p className="font-body text-sm text-error">{waiverError}</p>}
                  <div className="flex gap-4 pt-2">
                    <button type="button" onClick={() => { setSelectedSection(null); setWaiverError(""); }} className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground">Fechar</button>
                    <button type="button" disabled={waiverSaving} onClick={async () => {
                      if (!schoolId) return;
                      setWaiverError("");
                      if (!waiverTitle.trim()) { setWaiverError("O título é obrigatório"); return; }
                      if (!waiverBody.trim()) { setWaiverError("O texto é obrigatório"); return; }
                      setWaiverSaving(true);
                      const res = await saveWaiverVersion(schoolId, { title: waiverTitle.trim(), body: waiverBody.trim() });
                      setWaiverSaving(false);
                      if (!res.ok) { setWaiverError(res.error ?? "Erro ao guardar"); return; }
                      setSelectedSection(null);
                    }} className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50">
                      {waiverSaving ? "A guardar..." : "Publicar nova versão"}
                    </button>
                  </div>

                  {/* Versions history */}
                  {waiverVersions.length > 0 && (
                    <div className="pt-6 border-t border-foreground/10">
                      <p className="font-heading text-base font-bold text-foreground mb-4">Histórico de versões</p>
                      <div className="space-y-2">
                        {waiverVersions.map((v) => (
                          <div key={v.id} className="flex items-center justify-between rounded-xl bg-[#2A2A2A] px-4 py-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-body text-sm font-semibold text-foreground truncate">
                                {v.title}
                                {v.is_active && <span className="ml-2 text-xs font-normal text-success">Ativo</span>}
                              </p>
                              <p className="font-body text-xs text-text-secondary">
                                v{v.version} · {new Date(v.created_at).toLocaleDateString("pt-PT")} · {v.acceptance_count} aceitação(ões)
                              </p>
                            </div>
                            {v.acceptance_count > 0 && (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!schoolId) return;
                                  const rows = await getWaiverAcceptances(schoolId, v.id);
                                  setWaiverAcceptances(rows);
                                  setShowWaiverAcceptances(v.id);
                                }}
                                className="shrink-0 rounded-lg bg-accent/20 px-3 py-1.5 font-body text-xs font-semibold text-accent transition-colors hover:bg-accent/30"
                              >
                                Ver aceitações
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
            className="w-full rounded-xl bg-error-bg py-3 font-body text-sm font-semibold text-error transition-colors hover:bg-error/30"
          >
            Terminar sessão
          </button>
        </div>
      </main>

      <BottomSheet
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        title="Editar Perfil"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowProfile(false)}
              className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={profileSaving}
              onClick={async () => {
                setProfileError("");
                if (profilePassword && profilePassword !== profileConfirmPassword) { setProfileError("As palavras-passe não coincidem"); return; }
                setProfileSaving(true);
                const res = await saveProfile({ name: profileName, email: profileEmail, phone: profilePhone, password: profilePassword || undefined });
                setProfileSaving(false);
                if (!res.ok) { setProfileError(res.error ?? "Erro ao guardar"); return; }
                setShowProfile(false);
              }}
              className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
            >
              {profileSaving ? "A guardar..." : "Guardar"}
            </button>
          </>
        }
      >
        <p className="font-body text-sm text-text-secondary -mt-4">Atualiza os teus dados</p>
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
            Palavra-passe <span className="text-text-muted">(opcional)</span>
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
            Confirmar palavra-passe <span className="text-text-muted">(opcional)</span>
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
        {profileError && <p className="font-body text-sm text-error">{profileError}</p>}
      </BottomSheet>

      <BottomSheet
        isOpen={showCompany}
        onClose={() => setShowCompany(false)}
        title="Editar Empresa"
        footer={
          <>
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
                  phone: companyPhone,
                });
                if (res.ok) setShowCompany(false);
                setCompanySaving(false);
              }}
              className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
            >
              {companySaving ? "A guardar..." : "Guardar"}
            </button>
          </>
        }
      >
        <p className="font-body text-sm text-text-secondary -mt-4">Atualiza os dados do negócio</p>
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
            Contacto (WhatsApp) <span className="text-text-muted">(opcional)</span>
          </label>
          <input
            type="text"
            value={companyPhone}
            onChange={(e) => setCompanyPhone(e.target.value)}
            placeholder="+351 9XXXXXXXX"
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
            rows={2}
            className="w-full resize-none rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent focus:outline-offset-[-2px]"
          />
        </div>
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
                if (file.size > 2 * 1024 * 1024) {
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
      </BottomSheet>

      <BottomSheet
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Definições"
        footer={
          <>
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
          </>
        }
      >
        {settingsError && <p className="font-body text-sm text-error">{settingsError}</p>}

        <div>
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

        <div className="h-px bg-foreground/10" />

        <div>
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

        <div className="h-px bg-foreground/10" />

        <div>
          <p className="font-heading text-base font-bold text-foreground mb-2">Termos e Condições</p>
          <p className="font-body text-sm text-text-secondary mb-4">Link para os termos e condições da escola (aparece no checkbox da reserva pública)</p>
          <input
            type="url"
            value={settings.terms_url ?? ""}
            onChange={(e) => setSettings((prev) => ({ ...prev, terms_url: e.target.value || null }))}
            className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-sm text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
            placeholder="https://exemplo.com/termos"
          />
        </div>

        <div className="h-px bg-foreground/10" />

        <div>
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
      </BottomSheet>

      <BottomSheet
        isOpen={showInstructors}
        onClose={() => { setShowInstructors(false); setInstrutorNome(""); setInstrutorNivel(""); setInstrutorFotoFile(null); setInstrutorFotoPreview(null); setEditingInstrutorId(null); }}
        title={editingInstrutorId !== null ? "Editar Instrutor" : "Adicionar Instrutor"}
        footer={
          <>
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
          </>
        }
      >
        <div className="flex justify-center mb-6">
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
              setInstrutorError("");
              const file = e.target.files?.[0];
              if (!file) return;
              if (!["image/png", "image/webp", "image/jpeg"].includes(file.type)) { setInstrutorError("Formato não permitido. Usa PNG, WebP ou JPEG"); return; }
              if (file.size > 1024 * 1024) { setInstrutorError(`Foto demasiado grande. Máximo ${(1024 * 1024) / (1024 * 1024)}MB`); return; }
              setInstrutorFotoFile(file);
              const reader = new FileReader();
              reader.onloadend = () => setInstrutorFotoPreview(reader.result as string);
              reader.readAsDataURL(file);
            }}
          />
        </div>

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

        {instrutores.length > 0 && (
          <div className="space-y-2">
            {instrutores.map((inst) => (
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
      </BottomSheet>

      <BottomSheet
        isOpen={showWaivers}
        onClose={() => { setShowWaivers(false); setWaiverError(""); }}
        title="Waivers"
        footer={
          <>
            <button
              type="button"
              onClick={() => { setShowWaivers(false); setWaiverError(""); }}
              className="flex-1 rounded-xl bg-[#2A2A2A] py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={waiverSaving}
              onClick={async () => {
                if (!schoolId) return;
                setWaiverError("");
                if (!waiverTitle.trim()) { setWaiverError("O título é obrigatório"); return; }
                if (!waiverBody.trim()) { setWaiverError("O texto é obrigatório"); return; }
                setWaiverSaving(true);
                const res = await saveWaiverVersion(schoolId, { title: waiverTitle.trim(), body: waiverBody.trim() });
                setWaiverSaving(false);
                if (!res.ok) { setWaiverError(res.error ?? "Erro ao guardar"); return; }
                setShowWaivers(false);
              }}
              className="flex-1 rounded-xl bg-accent py-3 font-body text-sm font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
            >
              {waiverSaving ? "A guardar..." : "Publicar nova versão"}
            </button>
          </>
        }
      >
        <div>
          <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Título do waiver</label>
          <input
            type="text"
            value={waiverTitle}
            onChange={(e) => setWaiverTitle(e.target.value)}
            placeholder="Ex: Termos de responsabilidade"
            maxLength={150}
            className="w-full rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
          />
        </div>
        <div>
          <label className="font-body text-sm font-semibold text-text-secondary mb-1 block">Texto do waiver</label>
          <textarea
            value={waiverBody}
            onChange={(e) => setWaiverBody(e.target.value)}
            placeholder="Escreve aqui os termos que os alunos devem aceitar..."
            rows={6}
            maxLength={20000}
            className="w-full resize-none rounded-xl bg-[#2A2A2A] px-4 py-3 text-foreground placeholder-text-muted outline-none focus:outline-2 focus:outline-accent"
          />
        </div>

        {waiverError && <p className="font-body text-sm text-error">{waiverError}</p>}

        {waiverVersions.length > 0 && (
          <div className="pt-4 border-t border-foreground/10">
            <p className="font-heading text-base font-bold text-foreground mb-3">Histórico</p>
            <div className="space-y-2">
              {waiverVersions.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-xl bg-[#2A2A2A] px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-sm font-semibold text-foreground truncate">
                      v{v.version} {v.is_active && <span className="text-xs text-success">(Ativo)</span>}
                    </p>
                    <p className="font-body text-xs text-text-secondary">{v.acceptance_count} aceitação(ões)</p>
                  </div>
                  {v.acceptance_count > 0 && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!schoolId) return;
                        const rows = await getWaiverAcceptances(schoolId, v.id);
                        setWaiverAcceptances(rows);
                        setShowWaiverAcceptances(v.id);
                      }}
                      className="shrink-0 rounded-lg bg-accent/20 px-3 py-1.5 font-body text-xs font-semibold text-accent"
                    >
                      Ver
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Waiver Acceptances Dialog */}
      {showWaiverAcceptances && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-5" onClick={() => setShowWaiverAcceptances(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading text-lg font-bold text-foreground mb-4">Aceitações</h3>
            {waiverAcceptances.length === 0 ? (
              <p className="font-body text-sm text-text-secondary py-4 text-center">Nenhuma aceitação ainda</p>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {waiverAcceptances.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-xl bg-[#2A2A2A] px-4 py-3">
                    <p className="font-body text-sm text-foreground">{a.student_name}</p>
                    <p className="font-body text-xs text-text-secondary">{new Date(a.accepted_at).toLocaleDateString("pt-PT")}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setShowWaiverAcceptances(null)}
                className="rounded-xl bg-[#2A2A2A] px-6 py-3 font-body text-sm font-semibold text-text-secondary transition-colors hover:text-foreground"
              >
                Fechar
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
