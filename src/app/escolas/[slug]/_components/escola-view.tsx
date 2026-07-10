"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import type { PublicSchoolData } from "../actions";
import { toggleFavorite, comprarPackPublico, criarReservaPublica, criarReservaAluguer } from "../actions";
import type { ParticipantInput } from "../actions";
import { useTurnstile } from "./turnstile-widget";
import { Lightbox } from "./lightbox";
import { PublicCalendar } from "./public-calendar";
import { PublicNavbar } from "@/app/_components/public-navbar";
import { createClient } from "@/lib/supabase/client";

type Props = {
  data: PublicSchoolData;
};

export function EscolaView({ data }: Props) {
  const { school, images, services, instructors } = data;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<PublicSchoolData["services"][number] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedModality, setSelectedModality] = useState<string | null>(null);

  const allModalities = [...new Set(services.map((s) => s.modality).filter(Boolean))] as string[];
  const filteredServices = services.filter((s) => {
    if (selectedCategory && s.category !== selectedCategory) return false;
    if (selectedModality && s.modality !== selectedModality) return false;
    return true;
  });

  const INITIAL_LIMIT = 5;
  const [showAllModal, setShowAllModal] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<PublicSchoolData["upcomingSessions"]>([]);
  const [displayCount, setDisplayCount] = useState(10);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; phone: string } | null>(null);

  const [packName, setPackName] = useState("");
  const [packEmail, setPackEmail] = useState("");
  const [packPhone, setPackPhone] = useState("");
  const [packFormError, setPackFormError] = useState<string | null>(null);
  const [packQuantity, setPackQuantity] = useState(1);
  const [showPackSuccess, setShowPackSuccess] = useState(false);
  const [packLoading, setPackLoading] = useState(false);
  const [selectedRentalVariantId, setSelectedRentalVariantId] = useState<string | null>(null);
  const { containerRef: turnstileRef, execute: turnstileExecute } = useTurnstile();
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);
  const [participantsBySession, setParticipantsBySession] = useState<Record<string, { name: string; age: string; nota: string; parentalConsent: boolean }[]>>({});
  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [payerPhoneCode, setPayerPhoneCode] = useState("+351");
  const [payerPhone, setPayerPhone] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [rentalDate, setRentalDate] = useState("");
  const [rentalTime, setRentalTime] = useState("");
  const selSvc = selectedServiceId ? services.find(s => s.id === selectedServiceId) ?? null : null;
  const isRental = selSvc?.category === "aluguer";

  useEffect(() => {
    if (!showServicePicker) return;
    const id = requestAnimationFrame(() => {
      setSelectedSessions([]);
      setBookingStep(1);
      setParticipantsBySession({});
      setPackQuantity(1);
      setPackFormError(null);
      setShowPackSuccess(false);
      setRentalDate("");
      setRentalTime("");
      setPayerName(userInfo?.name ?? "");
      setPayerEmail(userInfo?.email ?? "");
      setPayerPhone(userInfo?.phone ?? "");
      setTermsAccepted(false);
      setBookingError(null);
      setBookingSuccess(false);
    });
    return () => cancelAnimationFrame(id);
  }, [showServicePicker, userInfo]);

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("school_id", school.id)
        .maybeSingle();
      if (data) setFavorited(true);

      // Fetch user profile
      const { data: student } = await supabase
        .from("students")
        .select("full_name, email, phone")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      const userData = {
        name: student?.full_name ?? user.user_metadata?.full_name ?? "",
        email: student?.email ?? user.email ?? "",
        phone: student?.phone ?? "",
      };
      setUserInfo(userData);
      setPackName(userData.name);
      setPackEmail(userData.email);
      setPackPhone(userData.phone);
    };
    check();
  }, [school.id]);

  const sanitizeName = (v: string) => v.replace(/[^a-zA-Zà-ÿÀ-ß '´`-]/g, "").slice(0, 80);
  const sanitizeEmail = (v: string) => v.trim().toLowerCase().slice(0, 120);
  const sanitizePhone = (v: string) => v.replace(/[^0-9+]/g, "").slice(0, 20);

  const handleToggleFavorite = useCallback(async () => {
    setFavoriteError(null);
    setFavoriteLoading(true);
    const res = await toggleFavorite(school.id, favorited ? "remove" : "add");
    setFavoriteLoading(false);
    if (!res.ok) {
      setFavoriteError(res.error);
      setTimeout(() => setFavoriteError(null), 4000);
      return;
    }
    setFavorited(res.favorited);
  }, [school.id, favorited]);

  useEffect(() => {
    if (!showAllModal) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDisplayCount((prev) => Math.min(prev + 10, filteredServices.length));
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [showAllModal, filteredServices.length]);

  return (
    <div className="bg-[#F7FAFC]">
      <PublicNavbar />
      {/* Header */}
      <section className="px-5 pt-20 sm:px-8 sm:pt-24">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-gray-900">
              {school.name}
            </h1>
            <button
              type="button"
              onClick={handleToggleFavorite}
              disabled={favoriteLoading}
              className="shrink-0 h-9 w-9 rounded-full border border-blue-500 bg-white flex items-center justify-center text-black transition-colors hover:border-accent hover:bg-accent/5 disabled:opacity-50 mt-2 ml-2"
              aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill={favorited ? "#FF6B35" : "none"}
                stroke={favorited ? "#FF6B35" : "currentColor"}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          </div>
          {school.location && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
              <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              {school.location}
            </p>
          )}
        </div>
      </section>

      {favoriteError && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 w-[90%] max-w-md rounded-xl bg-red-50 border border-red-200 px-5 py-3 text-sm text-red-700 shadow-lg animate-in fade-in">
          {favoriteError}
        </div>
      )}

      {/* Galeria + Serviços */}
      <section className="px-5 pt-8 pb-8 sm:px-8 sm:pb-12">
        <div className="mx-auto max-w-5xl">

          {/* Mobile gallery carousel */}
          <div className="md:hidden relative mb-6">
            {images.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(galleryIndex)}
                  className="w-full rounded-xl overflow-hidden"
                >
                  <img
                    src={images[galleryIndex].public_url}
                    alt=""
                    className="w-full h-[300px] object-cover"
                  />
                </button>
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setGalleryIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-black/40 text-white shadow flex items-center justify-center hover:bg-black/60 backdrop-blur-sm transition-colors"
                      aria-label="Anterior"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGalleryIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-black/40 text-white shadow flex items-center justify-center hover:bg-black/60 backdrop-blur-sm transition-colors"
                      aria-label="Seguinte"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
                      {images.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 w-1.5 rounded-full transition-colors shadow-sm ${i === galleryIndex ? "bg-white" : "bg-white/50"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center rounded-xl bg-gray-100 h-[280px]">
                <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-start">
            {/* Coluna esquerda: foto grande + serviços */}
            <div className="flex flex-col gap-8 md:w-[65%]">
              <button
                type="button"
                onClick={images[0] ? () => setLightboxIndex(0) : undefined}
                className="hidden md:block overflow-hidden rounded-xl md:h-[420px]"
              >
                {images[0] ? (
                  <img
                    src={images[0].public_url}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ minHeight: 280 }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100" style={{ minHeight: 280 }}>
                    <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                    </svg>
                  </div>
                )}
              </button>

              {services.length > 0 && (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <h2 className="font-heading text-2xl font-bold text-gray-900 shrink-0 py-1">
                      Serviços
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCategory(null)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                          selectedCategory === null
                            ? "bg-accent text-white"
                            : "bg-white text-gray-600 border border-gray-200 hover:border-accent"
                        }`}
                      >
                        Todas
                      </button>
                      {["aula", "pack", "aluguer"].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                            selectedCategory === cat
                              ? "bg-accent text-white"
                              : "bg-white text-gray-600 border border-gray-200 hover:border-accent"
                          }`}
                        >
                          {cat === "aula" ? "Aulas" : cat === "pack" ? "Packs de Aulas" : "Alugueres"}
                        </button>
                      ))}
                      {allModalities.length > 0 && (
                        <div className="relative">
                          <select
                            value={selectedModality ?? ""}
                            onChange={(e) => setSelectedModality(e.target.value || null)}
                            className="appearance-none rounded-full border border-gray-200 bg-white px-4 py-1.5 pr-8 text-sm text-gray-600 outline-none focus:border-accent"
                          >
                            <option value="">Todas as modalidades</option>
                            {allModalities.map((mod) => (
                              <option key={mod} value={mod}>{mod}</option>
                            ))}
                          </select>
                          <svg className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredServices.slice(0, INITIAL_LIMIT).map((svc) => (
                      <ServiceCard
                        key={svc.id}
                        svc={svc}
                        onClick={() => setSelectedService(svc)}
                        onReservarClick={() => { setSelectedServiceId(svc.id); setShowServicePicker(true); }}
                        rentalVariantId={svc.rental_options?.length ? (selectedRentalVariantId ?? svc.rental_options[0].id) : undefined}
                        onRentalVariantChange={svc.rental_options?.length ? setSelectedRentalVariantId : undefined}
                      />
                    ))}
                    {filteredServices.length > INITIAL_LIMIT && (
                      <button
                        type="button"
                        onClick={() => {
                          setDisplayCount(10);
                          setShowAllModal(true);
                        }}
                        className="w-full text-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-4 text-sm font-semibold text-gray-500 transition-colors hover:border-accent hover:text-accent"
                      >
                        Ver mais (+{filteredServices.length - INITIAL_LIMIT})
                      </button>
                    )}
                  </div>
                </div>
              )}


            </div>

            {/* Coluna direita: 2 fotos + info card */}
            <div className="flex flex-col md:w-[35%]">
              <div className="hidden md:flex flex-col gap-3 md:h-[420px]">
                {images[1] ? (
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(1)}
                    className="overflow-hidden rounded-xl flex-1 h-0"
                  >
                    <img
                      src={images[1].public_url}
                      alt=""
                      className="h-full w-full object-cover"
                      style={{ height: "100%", objectFit: "cover" }}
                    />
                  </button>
                ) : (
                  <div className="flex flex-1 h-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                    <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                    </svg>
                  </div>
                )}
                {images[2] ? (
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(2)}
                    className="overflow-hidden rounded-xl flex-1 h-0 relative"
                  >
                    <img
                      src={images[2].public_url}
                      alt=""
                      className="h-full w-full object-cover"
                      style={{ height: "100%", objectFit: "cover" }}
                    />
                    {images.length > 3 && (
                      <div className="absolute inset-0 flex items-end justify-center bg-black/30 rounded-xl pb-4">
                        <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow transition-transform hover:scale-105">
                          Ver mais fotos
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    )}
                  </button>
                ) : (
                  <div className="flex flex-1 h-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                    <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="rounded-xl bg-white p-5 shadow-sm mt-4 md:mt-[88px]">
                <h3 className="font-heading font-semibold text-gray-900 text-[32px]">
                  {school.name}
                </h3>
                {school.location && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-600">
                    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    {school.location}
                  </p>
                )}
                {school.description && (
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {school.description}
                  </p>
                )}
                {school.location && (
                  <div className="mt-4 overflow-hidden rounded-xl">
                    <iframe
                      src={`https://www.google.com/maps?q=${encodeURIComponent(`${school.name}, ${school.location}`)}&output=embed`}
                      width="100%"
                      height="180"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      title="Localização da escola"
                    />
                  </div>
                )}
              </div>
              {instructors.length > 0 && (
                <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
                  <h2 className="font-heading text-xl font-bold text-gray-900 mb-4">
                    Instrutores
                  </h2>
                  <div className="grid grid-cols-3 gap-6">
                    {instructors.map((inst) => (
                      <div key={inst.name} className="flex flex-col items-center text-center">
                        <div className="h-16 w-16 overflow-hidden rounded-full bg-gray-200">
                          {inst.avatar_url ? (
                            <img
                              src={inst.avatar_url}
                              alt={inst.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-500">
                              {inst.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <p className="mt-2 text-sm font-semibold text-gray-900 text-center leading-tight">
                          {inst.name}
                        </p>
                        <p className="text-xs text-gray-500 text-center leading-tight">
                          {inst.level}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Modal Ver mais */}
      {showAllModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={() => setShowAllModal(false)}
        >
          <div
            className="flex w-full max-w-2xl flex-col rounded-t-2xl bg-white p-6 max-h-[75vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="font-heading text-lg font-bold text-gray-900">
                Todos os serviços
              </h3>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setShowAllModal(false)}
                className="rounded-full bg-gray-100 p-2 text-gray-500 transition-colors hover:bg-gray-200"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto -mx-6 px-6">
              <div className="space-y-3 pb-4">
                {filteredServices.slice(0, displayCount).map((svc) => (
                  <ServiceCard
                    key={svc.id}
                    svc={svc}
                    onClick={() => { setShowAllModal(false); setSelectedService(svc); }}
                    onReservarClick={() => { setShowAllModal(false); setSelectedServiceId(svc.id); setShowServicePicker(true); }}
                    rentalVariantId={svc.rental_options?.length ? (selectedRentalVariantId ?? svc.rental_options[0].id) : undefined}
                    onRentalVariantChange={svc.rental_options?.length ? setSelectedRentalVariantId : undefined}
                  />
                ))}
                {displayCount < filteredServices.length && (
                  <div ref={sentinelRef} className="h-4" />
                )}
                {displayCount >= filteredServices.length && filteredServices.length > INITIAL_LIMIT && (
                  <p className="text-center text-sm text-gray-400 py-2">
                    Mostrando todos os {filteredServices.length} serviços
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Serviço */}
      {selectedService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-xl font-bold text-gray-900">
                  {selectedService.name}
                </h3>
                {selectedService.rental_options && selectedService.rental_options.length > 1 ? (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-2">Duração:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedService.rental_options.map((opt) => {
                        const isActive = (selectedRentalVariantId ?? selectedService.rental_options![0].id) === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedRentalVariantId(opt.id); }}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                              isActive
                                ? "bg-accent text-white"
                                : "bg-gray-100 text-gray-600 border border-gray-200 hover:border-accent"
                            }`}
                          >
                            {formatDurationLabel(opt.duration_minutes)} · {(opt.price_cents / 100).toFixed(2).replace(".", ",")}€
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">
                    {formatDurationLabel(selectedService.duration_minutes)}
                  </p>
                )}
                {selectedService.description && (
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {selectedService.description}
                  </p>
                )}
                <p className="mt-2 font-heading text-lg font-bold text-gray-900">
                  {(selectedService.price_cents / 100).toFixed(2).replace(".", ",")} €
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedServiceId(selectedService.id); setSelectedService(null); setShowServicePicker(true); }}
                className="shrink-0 rounded-full border-2 border-accent px-5 py-2 text-sm font-semibold text-black transition-transform hover:scale-105 hover:bg-accent hover:text-white"
              >
                Reservar
              </button>
            </div>

            <button type="button" onClick={() => setSelectedService(null)}
              className="mt-6 w-full rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-200"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <div ref={turnstileRef} className="hidden" />
      {showServicePicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowServicePicker(false)}
        >
          <div
            className="w-full max-w-5xl rounded-2xl bg-white p-6 shadow-xl h-[85vh] flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="font-heading text-lg font-bold text-gray-900">
                {bookingStep === 1 ? "Reservar aula" : bookingStep === 3 ? "Confirmação" : "Participantes"}
              </h3>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setShowServicePicker(false)}
                className="rounded-full bg-gray-100 p-2 text-gray-500 transition-colors hover:bg-gray-200"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {bookingStep === 1 && (
              <div className="flex flex-wrap items-center gap-2 mb-4 px-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    selectedCategory === null
                      ? "bg-accent text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-accent"
                  }`}
                >
                  Todas
                </button>
                {["aula", "pack", "aluguer"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                      selectedCategory === cat
                        ? "bg-accent text-white"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-accent"
                    }`}
                  >
                    {cat === "aula" ? "Aulas" : cat === "pack" ? "Packs de Aulas" : "Alugueres"}
                  </button>
                ))}
                {allModalities.length > 0 && (
                  <div className="relative ml-auto">
                    <select
                      value={selectedModality ?? ""}
                      onChange={(e) => setSelectedModality(e.target.value || null)}
                      className="appearance-none rounded-full border border-gray-200 bg-white px-4 py-1.5 pr-8 text-sm text-gray-600 outline-none focus:border-accent"
                    >
                      <option value="">Todas as modalidades</option>
                      {allModalities.map((mod) => (
                        <option key={mod} value={mod}>{mod}</option>
                      ))}
                    </select>
                    <svg className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                )}
              </div>
            )}

            {/* Services + Calendar (Step 1) OR Participant forms (Step 2) */}
            <div className="flex flex-row gap-6">
              {bookingStep === 1 ? (
                <>
                  {/* Services list */}
            <div className="flex-1 overflow-y-auto p-0.5 -m-0.5">
                    <div className="space-y-2">
                      {filteredServices.map((svc) => {
                        const isSelected = selectedServiceId === svc.id;
                        const ctaLabel =
                          svc.category === "pack" ? "Comprar"
                          : svc.category === "aluguer" ? "Alugar"
                          : "Reservar";

                        return (
                          <div
                            key={svc.id}
                            className={`flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm border transition-colors ${
                              isSelected ? "border-accent" : "border-gray-100"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <h4 className="font-heading text-gray-900 text-sm">
                                {svc.name}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {svc.duration_minutes} min · {(svc.price_cents / 100).toFixed(2).replace(".", ",")} €
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedServiceId(null);
                                } else {
                                  setSelectedServiceId(svc.id);
                                }
                              }}
                              className={`shrink-0 rounded-full border-2 px-4 py-1.5 text-sm transition-all hover:scale-105 ${
                                isSelected
                                  ? "border-accent bg-accent text-white"
                                  : "border-accent text-black hover:bg-accent hover:text-white"
                              }`}
                            >
                              {ctaLabel}
                            </button>
                          </div>
                        );
                      })}
                      {filteredServices.length === 0 && (
                        <p className="py-8 text-center text-sm text-gray-400">
                          Nenhum serviço disponível para esta categoria.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right column — calendar for aulas, form for packs/aluguer */}
                  <div className="w-[320px] shrink-0">
                    {(() => {
                      const rightSvc = services.find(s => s.id === selectedServiceId);
                      if (!rightSvc) return <div />;
                      if (rightSvc.category === "aula") {
                        return (
                          <PublicCalendar
                            schoolId={school.id}
                            classTypeId={selectedServiceId}
                            selectedSessionIds={new Set(selectedSessions.map(s => s.id))}
                            onToggleSession={(session) => {
                              setSelectedSessions(prev => {
                                const exists = prev.find(s => s.id === session.id);
                                if (exists) return prev.filter(s => s.id !== session.id);
                                return [...prev, session];
                              });
                            }}
                          />
                        );
                      }
                      if (rightSvc.category === "pack") {
                        if (showPackSuccess) {
                          return (
                            <div className="text-center py-8">
                              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <h3 className="font-heading text-lg font-bold text-gray-900">
                                Pedido confirmado!
                              </h3>
                              <p className="mt-2 text-sm text-gray-600">
                                O seu pedido foi confirmado, entraremos em contacto.
                              </p>
                            </div>
                          );
                        }
                        return (
                          <div className="space-y-3">
                            {rightSvc.rental_options && rightSvc.rental_options.length > 1 && (
                              <div>
                                <label className="block text-sm text-gray-700 mb-1">Duração</label>
                                <div className="flex flex-wrap gap-2">
                                  {rightSvc.rental_options.map((opt) => {
                                    const isActive = (selectedRentalVariantId ?? rightSvc.rental_options![0].id) === opt.id;
                                    return (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedRentalVariantId(opt.id);
                                        }}
                                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                          isActive
                                            ? "bg-accent text-white"
                                            : "bg-white text-gray-600 border border-gray-200 hover:border-accent"
                                        }`}
                                      >
                                        {formatDurationLabel(opt.duration_minutes)} · {(opt.price_cents / 100).toFixed(2).replace(".", ",")}€
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">Nome</label>
                              <input
                                type="text"
                                value={packName}
                                onChange={(e) => { setPackFormError(null); setPackName(sanitizeName(e.target.value)); }}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-accent"
                                placeholder="O teu nome"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">Email</label>
                              <input
                                type="email"
                                value={packEmail}
                                onChange={(e) => { setPackFormError(null); setPackEmail(sanitizeEmail(e.target.value)); }}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-accent"
                                placeholder="O teu email"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">Telemóvel</label>
                              <input
                                type="tel"
                                value={packPhone}
                                onChange={(e) => { setPackFormError(null); setPackPhone(sanitizePhone(e.target.value)); }}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-accent"
                                placeholder="O teu telemóvel"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">Quantidade</label>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => setPackQuantity(Math.max(1, packQuantity - 1))}
                                  className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-accent hover:text-accent"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                                  </svg>
                                </button>
                                <span className="w-8 text-center text-sm font-semibold text-gray-900">{packQuantity}</span>
                                <button
                                  type="button"
                                  onClick={() => setPackQuantity(Math.min(99, packQuantity + 1))}
                                  className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-accent hover:text-accent"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            {packFormError && (
                              <p className="text-xs text-red-500">{packFormError}</p>
                            )}
                          </div>
                        );
                      }
                      if (rightSvc.category === "aluguer") {
                        return (
                          <div className="space-y-3 px-2">
                            {rightSvc.rental_options && rightSvc.rental_options.length > 1 && (
                              <div>
                                <label className="block text-sm text-gray-700 mb-1">Duração</label>
                                <div className="flex flex-wrap gap-2">
                                  {rightSvc.rental_options.map((opt) => {
                                    const isActive = (selectedRentalVariantId ?? rightSvc.rental_options![0].id) === opt.id;
                                    return (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => { setSelectedRentalVariantId(opt.id); }}
                                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                          isActive
                                            ? "bg-accent text-white"
                                            : "bg-white text-gray-600 border border-gray-200 hover:border-accent"
                                        }`}
                                      >
                                        {formatDurationLabel(opt.duration_minutes)} · {(opt.price_cents / 100).toFixed(2).replace(".", ",")}€
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">Quantidade</label>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => setPackQuantity(Math.max(1, packQuantity - 1))}
                                  className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-accent hover:text-accent"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                                  </svg>
                                </button>
                                <span className="w-8 text-center text-sm font-semibold text-gray-900">{packQuantity}</span>
                                <button
                                  type="button"
                                  onClick={() => setPackQuantity(Math.min(99, packQuantity + 1))}
                                  className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-accent hover:text-accent"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">Data</label>
                              <input
                                type="date"
                                value={rentalDate}
                                onChange={(e) => setRentalDate(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-accent [color-scheme:light] [&::-webkit-calendar-picker-indicator]:opacity-50"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">Hora</label>
                              <input
                                type="time"
                                value={rentalTime}
                                onChange={(e) => setRentalTime(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-accent [color-scheme:light] [&::-webkit-calendar-picker-indicator]:opacity-50"
                              />
                            </div>
                          </div>
                        );
                      }
                      return <div />;
                    })()}
                  </div>
                </>
              ) : (
                /* Step 2/3 — left: participant forms, right: summary or payer */
                <div className="flex flex-row gap-6 w-full">
                  <div className="flex-1 space-y-6">
                    {bookingStep === 3 ? (
                      <div className="space-y-4 px-2">
                        <h4 className="font-heading text-sm font-bold text-gray-900">Dados do pagador</h4>
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Nome</label>
                          <input
                            type="text"
                            value={payerName}
                            onChange={(e) => setPayerName(e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, "").slice(0, 80))}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus-visible:outline-[0px]"
                            placeholder="O teu nome"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={payerEmail}
                            onChange={(e) => setPayerEmail(e.target.value.trim().toLowerCase().slice(0, 120))}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus-visible:outline-[0px]"
                            placeholder="O teu email"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Telemóvel</label>
                          <div className="flex gap-2">
                            <input
                              type="tel"
                              value={payerPhoneCode}
                              onChange={(e) => setPayerPhoneCode(e.target.value.replace(/[^0-9+]/g, "").slice(0, 5))}
                              className="w-24 shrink-0 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus-visible:outline-[0px]"
                              placeholder="+351"
                            />
                            <input
                              type="tel"
                              value={payerPhone}
                              onChange={(e) => setPayerPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                              className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus-visible:outline-[0px]"
                              placeholder="O teu telemóvel"
                            />
                          </div>
                        </div>
                        <>
                          <hr className="border-gray-200" />
                          <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={termsAccepted}
                              onChange={(e) => setTermsAccepted(e.target.checked)}
                              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-accent"
                            />
                            <span>Aceito os Termos e Condições da {school.name}</span>
                          </label>
                        </>
                        {bookingError && (
                          <p className="text-xs text-red-500">{bookingError}</p>
                        )}
                      </div>
                    ) : (
                    isRental && bookingStep === 2 ? (
                      (() => {
                        const count = packQuantity;
                        const participants = Array.from({ length: count }, (_, i) =>
                          participantsBySession["rental-virtual"]?.[i] ?? { name: "", age: "", nota: "", parentalConsent: false }
                        );
                        return (
                          <div key="rental-virtual" className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <p className="font-heading text-sm font-bold text-gray-900 mb-4">
                              {rentalDate} {rentalTime} · {selSvc.name}
                            </p>
                            <p className="text-sm text-gray-600 mb-4">{count} {count === 1 ? "participante" : "participantes"}</p>
                            <div className="space-y-3">
                              {participants.map((p, idx) => (
                                <div key={idx} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                  <div className="flex gap-3 items-start mb-2">
                                    <span className="mt-3 text-xs text-gray-400 w-5 shrink-0">{idx + 1}.</span>
                                    <div className="flex-1">
                                      <input
                                        type="text"
                                        value={p.name}
                                        onChange={(e) => {
                                          const val = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, "").slice(0, 80);
                                          setParticipantsBySession(prev => {
                                            const arr = [...(prev["rental-virtual"] ?? [])];
                                            arr[idx] = { ...arr[idx], name: val };
                                            return { ...prev, "rental-virtual": arr };
                                          });
                                        }}
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-accent"
                                        placeholder={`Nome do participante ${idx + 1}`}
                                      />
                                    </div>
                                    <div className="w-20 shrink-0">
                                      <input
                                        type="number"
                                        min={1}
                                        max={120}
                                        value={p.age}
                                        onChange={(e) => {
                                          const val = e.target.value.replace(/\D/g, "").slice(0, 3);
                                          setParticipantsBySession(prev => {
                                            const arr = [...(prev["rental-virtual"] ?? [])];
                                            arr[idx] = { ...arr[idx], age: val };
                                            return { ...prev, "rental-virtual": arr };
                                          });
                                        }}
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-accent"
                                        placeholder="Idade"
                                      />
                                    </div>
                                  </div>
                                  <div className="ml-8 space-y-2">
                                    <textarea
                                      value={p.nota}
                                      onChange={(e) => {
                                        const val = e.target.value.slice(0, 500);
                                        setParticipantsBySession(prev => {
                                          const arr = [...(prev["rental-virtual"] ?? [])];
                                          arr[idx] = { ...arr[idx], nota: val };
                                          return { ...prev, "rental-virtual": arr };
                                        });
                                      }}
                                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-accent resize-none"
                                      placeholder="Nota (opcional) — e.g. altura, nível, restrições..."
                                      rows={2}
                                    />
                                    {p.age && parseInt(p.age) < 18 && (
                                      <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={p.parentalConsent}
                                          onChange={(e) => {
                                            setParticipantsBySession(prev => {
                                              const arr = [...(prev["rental-virtual"] ?? [])];
                                              arr[idx] = { ...arr[idx], parentalConsent: e.target.checked };
                                              return { ...prev, "rental-virtual": arr };
                                            });
                                          }}
                                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                                        />
                                        <span>Consentimento parental (menor de 18 anos)</span>
                                      </label>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                    [...selectedSessions].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()).map((sess) => {
                      const participants = participantsBySession[sess.id] ?? [{ name: "", age: "", nota: "", parentalConsent: false }];
                      return (
                        <div key={sess.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                          <p className="font-heading text-sm font-bold text-gray-900 mb-4">
                            {new Date(sess.starts_at).toLocaleDateString("pt-PT", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}, {new Date(sess.starts_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <div className="mb-3 flex items-center gap-3">
                            <span className="text-sm text-gray-600">Participantes nesta sessão:</span>
                            <button
                              type="button"
                              onClick={() => {
                                setParticipantsBySession(prev => {
                                  const arr = [...(prev[sess.id] ?? [{ name: "", age: "" }])];
                                  if (arr.length > 1) arr.pop();
                                  return { ...prev, [sess.id]: arr };
                                });
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-accent hover:text-accent"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="w-6 text-center text-sm font-semibold text-gray-900">{participants.length}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setParticipantsBySession(prev => {
                                  const arr = [...(prev[sess.id] ?? [{ name: "", age: "", nota: "", parentalConsent: false }])];
                                  if (arr.length < 20) arr.push({ name: "", age: "", nota: "", parentalConsent: false });
                                  return { ...prev, [sess.id]: arr };
                                });
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-accent hover:text-accent"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                          <div className="space-y-3">
                            {participants.map((p, idx) => (
                              <div key={idx} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                <div className="flex gap-3 items-start mb-2">
                                  <span className="mt-3 text-xs text-gray-400 w-5 shrink-0">{idx + 1}.</span>
                                  <div className="flex-1">
                                    <input
                                      type="text"
                                      value={p.name}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, "").slice(0, 80);
                                        setParticipantsBySession(prev => {
                                          const arr = [...(prev[sess.id] ?? [])];
                                          arr[idx] = { ...arr[idx], name: val };
                                          return { ...prev, [sess.id]: arr };
                                        });
                                      }}
                                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-accent"
                                      placeholder={`Nome do participante ${idx + 1}`}
                                    />
                                  </div>
                                  <div className="w-20 shrink-0">
                                    <input
                                      type="number"
                                      min={1}
                                      max={120}
                                      value={p.age}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, "").slice(0, 3);
                                        setParticipantsBySession(prev => {
                                          const arr = [...(prev[sess.id] ?? [])];
                                          arr[idx] = { ...arr[idx], age: val };
                                          return { ...prev, [sess.id]: arr };
                                        });
                                      }}
                                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-accent"
                                      placeholder="Idade"
                                    />
                                  </div>
                                </div>
                                <div className="ml-8 space-y-2">
                                  <textarea
                                    value={p.nota}
                                    onChange={(e) => {
                                      const val = e.target.value.slice(0, 500);
                                      setParticipantsBySession(prev => {
                                        const arr = [...(prev[sess.id] ?? [])];
                                        arr[idx] = { ...arr[idx], nota: val };
                                        return { ...prev, [sess.id]: arr };
                                      });
                                    }}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-accent resize-none"
                                    placeholder="Nota (opcional) — e.g. alergias, nível de surf, restrições..."
                                    rows={2}
                                  />
                                  {p.age && parseInt(p.age) < 18 && (
                                    <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={p.parentalConsent}
                                        onChange={(e) => {
                                          setParticipantsBySession(prev => {
                                            const arr = [...(prev[sess.id] ?? [])];
                                            arr[idx] = { ...arr[idx], parentalConsent: e.target.checked };
                                            return { ...prev, [sess.id]: arr };
                                          });
                                        }}
                                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                                      />
                                      <span>Consentimento parental (menor de 18 anos)</span>
                                    </label>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })))}
                  </div>

                  {(() => {
                    const rightSvc = services.find(s => s.id === selectedServiceId);
                    if (!rightSvc) return null;
                    const vInfo = rightSvc.rental_options?.find(o => o.id === selectedRentalVariantId);
                    const effPriceCents = vInfo?.price_cents ?? rightSvc.price_cents;
                    const totParticipants = selectedSessions.reduce((sum, s) => sum + (participantsBySession[s.id]?.length ?? 1), 0);
                    const rentalTotal = isRental ? packQuantity * effPriceCents : effPriceCents * totParticipants;

                    return (
                      <div className="w-[320px] shrink-0">
                        <div className="sticky top-0 space-y-4">
                          <h4 className="font-heading text-sm font-bold text-gray-900">{isRental ? "Resumo" : "Sessões selecionadas"}</h4>
                          {isRental && (bookingStep === 2 || bookingStep === 3) ? (
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{rentalDate} {rentalTime}</p>
                                <p className="text-xs text-gray-500">{packQuantity} {packQuantity === 1 ? "participante" : "participantes"}</p>
                              </div>
                              <p className="text-sm font-semibold text-gray-900">{((packQuantity * effPriceCents) / 100).toFixed(2).replace(".", ",")} €</p>
                            </div>
                          ) : (
                          [...selectedSessions].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()).map((sess) => {
                            const d = new Date(sess.starts_at);
                            const day = d.getDate().toString().padStart(2, "0");
                            const month = (d.getMonth() + 1).toString().padStart(2, "0");
                            const year = d.getFullYear();
                            const time = d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
                            const ps = participantsBySession[sess.id]?.length ?? 1;
                            const sessionPrice = effPriceCents * ps;
                            return (
                              <div key={sess.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{day}/{month}/{year}, {time}</p>
                                  <p className="text-xs text-gray-500">{ps} participante{ps !== 1 ? "s" : ""}</p>
                                </div>
                                <p className="text-sm font-semibold text-gray-900">{(sessionPrice / 100).toFixed(2).replace(".", ",")} €</p>
                              </div>
                            );
                          }))}
                          <div className="flex items-center justify-between pt-2">
                            <p className="text-sm font-bold text-gray-900">Total</p>
                            <p className="text-sm font-bold text-accent">{(rentalTotal / 100).toFixed(2).replace(".", ",")} €</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            </div>

            {/* Bottom bar */}
            {(() => {
              const selSvc = services.find(s => s.id === selectedServiceId);
              if (!selectedServiceId || !selSvc) return null;
              const isAula = selSvc.category === "aula";
              const isPack = selSvc.category === "pack";
              const isRental = selSvc.category === "aluguer";
              const variantInfo = selSvc.rental_options?.find(o => o.id === selectedRentalVariantId);
              const effectivePriceCents = variantInfo?.price_cents ?? selSvc.price_cents;
              const effectiveDuration = variantInfo?.duration_minutes ?? selSvc.duration_minutes;
              const totalParticipants = selectedSessions.reduce((sum, s) => sum + (participantsBySession[s.id]?.length ?? 1), 0);
              const qty = (isPack || isRental) ? packQuantity : (bookingStep === 2 ? totalParticipants : selectedSessions.length);
              const displayPrice = effectivePriceCents * qty;
              const itemName = qty === 1
                ? (selectedSessions[0]?.class_type_name ?? selSvc.name)
                : selSvc.name;
              const allParticipantsValid = isRental && bookingStep === 2
                ? (participantsBySession["rental-virtual"] ?? []).every(p =>
                    p.name.trim().length >= 2 && p.age.trim().length > 0 && parseInt(p.age) >= 1 && parseInt(p.age) <= 120 && (parseInt(p.age) >= 18 || p.parentalConsent)
                  )
                : selectedSessions.every(s => {
                    const ps = participantsBySession[s.id] ?? [{ name: "", age: "", nota: "", parentalConsent: false }];
                    return ps.every(p => p.name.trim().length >= 2 && p.age.trim().length > 0 && parseInt(p.age) >= 1 && parseInt(p.age) <= 120 && (parseInt(p.age) >= 18 || p.parentalConsent));
                  });
              const fullPhone = payerPhoneCode.trim() + payerPhone.trim();
              const payerValid = payerName.trim().length >= 2 && payerEmail.trim().includes("@") && payerEmail.trim().includes(".") && fullPhone.replace(/\D/g, "").length >= 6 && termsAccepted;
              const canContinue = isAula
                ? (bookingStep === 1 ? selectedSessions.length > 0 : bookingStep === 2 ? allParticipantsValid : payerValid)
                : isPack
                  ? (packName.trim().length >= 2 && packEmail.trim().includes("@") && packPhone.trim().length >= 6)
                  : isRental
                    ? (bookingStep === 1 ? rentalDate.length > 0 && rentalTime.length > 0 : bookingStep === 2 ? allParticipantsValid : payerValid)
                    : false;

              const handleContinue = async () => {
                if (isAula && bookingStep === 1 && selectedSessions.length > 0) {
                  setBookingStep(2);
                  const init: Record<string, { name: string; age: string; nota: string; parentalConsent: boolean }[]> = {};
                  const sorted = [...selectedSessions].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
                  sorted.forEach(s => { init[s.id] = [{ name: "", age: "", nota: "", parentalConsent: false }]; });
                  setParticipantsBySession(init);
                } else if (isAula && bookingStep === 2 && allParticipantsValid) {
                  setPayerName(userInfo?.name ?? "");
                  setPayerEmail(userInfo?.email ?? "");
                  setPayerPhone(userInfo?.phone ?? "");
                  setBookingStep(3);
                } else if (isAula && bookingStep === 3 && payerValid) {
                  setBookingSubmitting(true);
                  setBookingError(null);
                  const turnstileToken = await turnstileExecute();
                  const allParticipants: ParticipantInput[] = [];
                  const seen = new Set<string>();
                  for (const sess of selectedSessions) {
                    const ps = participantsBySession[sess.id] ?? [];
                    for (const p of ps) {
                      const key = `${p.name.trim()}-${p.age}`;
                      if (seen.has(key)) continue;
                      seen.add(key);
                      allParticipants.push({
                        name: p.name.trim(),
                        age: parseInt(p.age),
                        ...(p.nota?.trim() ? { nota: p.nota.trim() } : {}),
                        parentalConsent: p.parentalConsent,
                      });
                    }
                  }
                  const result = await criarReservaPublica(
                    school.id,
                    selectedSessions.map(s => s.id),
                    {
                      participants: allParticipants,
                      contactName: payerName.trim(),
                      contactEmail: payerEmail.trim().toLowerCase(),
                      contactPhone: payerPhoneCode.trim() + payerPhone.trim(),
                      termsAccepted,
                      termsUrl: school.terms_url ?? null,
                    },
                    turnstileToken ?? undefined
                  );
                  setBookingSubmitting(false);
                  if (!result.ok) { setBookingError(result.error); return; }
                  setBookingSuccess(true);
                } else if (isPack) {
                  const name = packName.trim();
                  const email = packEmail.trim();
                  const phone = packPhone.trim();
                  if (name.length < 2) { setPackFormError("Nome deve ter pelo menos 2 caracteres."); return; }
                  if (!email.includes("@") || !email.includes(".")) { setPackFormError("Email inválido."); return; }
                  if (phone.length < 6) { setPackFormError("Telemóvel deve ter pelo menos 6 dígitos."); return; }
                  setPackFormError(null);
                  setPackLoading(true);
                  const turnstileToken = await turnstileExecute();
                  const classTypeId = selectedRentalVariantId || selSvc.id;
                  const result = await comprarPackPublico(
                    school.id,
                    classTypeId,
                    packQuantity,
                    { name, email: email.toLowerCase(), phone },
                    turnstileToken ?? undefined
                  );
                  setPackLoading(false);
                  if (!result.ok) { setPackFormError(result.error); return; }
                  setShowPackSuccess(true);
                } else if (isRental && bookingStep === 1) {
                  setBookingStep(2);
                  const rentalParticipants = Array.from({ length: packQuantity }, () => ({
                    name: "", age: "", nota: "", parentalConsent: false,
                  }));
                  setParticipantsBySession({ "rental-virtual": rentalParticipants });
                } else if (isRental && bookingStep === 2 && allParticipantsValid) {
                  setPayerName(userInfo?.name ?? "");
                  setPayerEmail(userInfo?.email ?? "");
                  setPayerPhone(userInfo?.phone ?? "");
                  setBookingError(null);
                  setBookingStep(3);
                } else if (isRental && bookingStep === 3 && payerValid) {
                  setBookingSubmitting(true);
                  setBookingError(null);
                  const turnstileToken = await turnstileExecute();
                  const classTypeId = selectedRentalVariantId || selSvc.id;
                  const [y, m, d] = rentalDate.split('-').map(Number);
                  const [hh, mm] = rentalTime.split(':').map(Number);
                  const startsAt = new Date(y, m - 1, d, hh, mm).toISOString();
                  const rentalParticipants = (participantsBySession["rental-virtual"] ?? []).map(p => ({
                    name: p.name.trim(),
                    age: parseInt(p.age),
                    ...(p.nota?.trim() ? { nota: p.nota.trim() } : {}),
                    parentalConsent: p.parentalConsent,
                  }));
                  const result = await criarReservaAluguer(
                    school.id,
                    classTypeId,
                    rentalParticipants.length,
                    startsAt,
                    { name: payerName.trim(), email: payerEmail.trim().toLowerCase(), phone: payerPhoneCode.trim() + payerPhone.trim() },
                    turnstileToken ?? undefined,
                    rentalParticipants
                  );
                  setBookingSubmitting(false);
                  if (!result.ok) { setBookingError(result.error); return; }
                  setBookingSuccess(true);
                }
              };

              return (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  {(isAula || isRental) && (bookingStep === 2 || bookingStep === 3) ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (bookingStep === 3) {
                          if (isAula || isRental) {
                            setPayerName(userInfo?.name ?? "");
                            setPayerEmail(userInfo?.email ?? "");
                            const phone = userInfo?.phone ?? "";
                            const knownCodes = ["+351", "+34", "+1", "+44", "+49", "+33", "+55"];
                            const matchedCode = knownCodes.find(c => phone.startsWith(c));
                            if (matchedCode) {
                              setPayerPhoneCode(matchedCode);
                              setPayerPhone(phone.slice(matchedCode.length));
                            } else {
                              setPayerPhoneCode("+351");
                              setPayerPhone(phone);
                            }
                            setTermsAccepted(false);
                            setBookingError(null);
                            setBookingStep(2);
                          }
                        } else {
                          setBookingStep(1);
                        }
                      }}
                      className="text-sm text-gray-600 hover:text-accent"
                    >
                      ← Voltar
                    </button>
                  ) : (
                    <p className="text-sm text-gray-900">
                      {isAula && bookingStep === 1 && selectedSessions.length > 0 ? (
                        <span className="text-xs leading-relaxed">
                          <span className="font-medium text-foreground">Sessões selecionadas: </span>
                          {selectedSessions.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()).map((s, i) => {
                            const d = new Date(s.starts_at);
                            const day = d.getDate().toString().padStart(2, "0");
                            const month = (d.getMonth() + 1).toString().padStart(2, "0");
                            const time = d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
                            return (
                              <span key={s.id}>
                                {i > 0 && <span className="mx-1 text-text-muted">·</span>}
                                {day}/{month} {time}
                              </span>
                            );
                          })}
                        </span>
                      ) : isPack ? (
                        <>
                          <span>{qty > 1 ? `${qty}x ` : ""}{itemName}</span>
                          {variantInfo && (
                            <span className="mx-1 text-xs text-gray-400">({formatDurationLabel(effectiveDuration)})</span>
                          )}
                          <span className="mx-1.5">=</span>
                          <span className="font-semibold">{(displayPrice / 100).toFixed(2).replace(".", ",")} €</span>
                        </>
                      ) : isRental && bookingStep === 1 ? (
                        <>
                          <span>{qty > 1 ? `${qty}x ` : ""}{itemName}</span>
                          {variantInfo && (
                            <span className="mx-1 text-xs text-gray-400">({formatDurationLabel(effectiveDuration)})</span>
                          )}
                          <span className="mx-1.5">·</span>
                          <span className="text-xs text-gray-500">{rentalDate} {rentalTime}</span>
                          <span className="mx-1.5">=</span>
                          <span className="font-semibold">{(displayPrice / 100).toFixed(2).replace(".", ",")} €</span>
                        </>
                      ) : isRental && (bookingStep === 2 || bookingStep === 3) ? (
                        <>
                          <span>{qty > 1 ? `${qty}x ` : ""}{itemName}</span>
                          {variantInfo && (
                            <span className="mx-1 text-xs text-gray-400">({formatDurationLabel(effectiveDuration)})</span>
                          )}
                          <span className="mx-1.5">=</span>
                          <span className="font-semibold">{(displayPrice / 100).toFixed(2).replace(".", ",")} €</span>
                        </>
                      ) : (
                        <span className="text-gray-400">Seleciona uma sessão</span>
                      )}
                    </p>
                  )}
                  {showPackSuccess ? (
                    <button
                      type="button"
                      onClick={() => { setShowServicePicker(false); setShowPackSuccess(false); }}
                      className="rounded-full border-2 border-accent px-6 py-2 text-sm font-semibold text-black transition-all hover:scale-105 hover:bg-accent hover:text-white"
                    >
                      Fechar
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!canContinue || packLoading || bookingSubmitting}
                      onClick={handleContinue}
                      className={`rounded-full border-2 px-6 py-2 text-sm transition-all ${
                        canContinue && !packLoading && !bookingSubmitting
                          ? "border-accent text-black hover:scale-105 hover:bg-accent hover:text-white"
                          : "border-gray-200 text-gray-300"
                      }`}
                    >
                      {bookingSubmitting ? "A processar..." : bookingStep === 3 ? "Confirmar reserva" : bookingStep === 2 ? "Continuar" : "Continuar"}
                    </button>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Success state overlay */}
          {bookingSuccess && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white rounded-2xl px-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-heading text-2xl font-bold text-gray-900 mb-2">Reserva confirmada!</h3>
              <p className="text-sm text-gray-600 mb-6 max-w-xs">Receberás um email com os detalhes da tua reserva.</p>
              <button
                type="button"
                onClick={() => {
                  setShowServicePicker(false);
                  setBookingStep(1);
                  setBookingSuccess(false);
                }}
                className="rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white hover:brightness-110"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-700 bg-gray-800 px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            {/* Brand */}
            <div className="max-w-xs">
              <Link href="/" className="font-heading text-xl font-bold text-white">
                Alaia
              </Link>
              <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                Plataforma de gestão para escolas de surf e desportos aquáticos.
              </p>
            </div>
            {/* Links */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Produto
              </p>
              <button
                onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}
                className="text-sm text-gray-300 text-left transition-colors hover:text-accent-light focus-visible:outline-2 focus-visible:outline-accent-light"
              >
                Como funciona?
              </button>
              <button
                onClick={() => document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" })}
                className="text-sm text-gray-300 text-left transition-colors hover:text-accent-light focus-visible:outline-2 focus-visible:outline-accent-light"
              >
                Contacto
              </button>
              <a
                href="/signup-owner"
                className="text-sm text-gray-300 transition-colors hover:text-accent-light focus-visible:outline-2 focus-visible:outline-accent-light"
              >
                Registar o seu negócio
              </a>
            </div>
          </div>
          {/* Divider + Copyright */}
          <div className="mt-10 pt-6 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-400">&copy; 2026 Alaia</p>
            <div className="flex gap-4 text-xs text-gray-400">
              <a href="/termos" className="hover:text-accent-light transition-colors focus-visible:outline-2 focus-visible:outline-accent-light">Termos</a>
              <a href="/privacidade" className="hover:text-accent-light transition-colors focus-visible:outline-2 focus-visible:outline-accent-light">Privacidade</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function formatDurationLabel(minutes: number): string {
  if (minutes % 1440 === 0) {
    const d = minutes / 1440;
    return d === 1 ? "1 dia" : `${d} dias`;
  }
  return `${minutes / 60}h`;
}

function ServiceCard({ svc, onClick, onReservarClick, rentalVariantId, onRentalVariantChange }: {
  svc: PublicSchoolData["services"][number];
  onClick: () => void;
  onReservarClick: () => void;
  rentalVariantId?: string;
  onRentalVariantChange?: (id: string) => void;
}) {
  const hasOptions = !!(svc.rental_options && svc.rental_options.length > 1);
  const currentVariantId = rentalVariantId ?? svc.rental_options?.[0]?.id;
  const currentOption = svc.rental_options?.find(o => o.id === currentVariantId);
  const effectivePrice = currentOption?.price_cents ?? svc.price_cents;
  const effectiveDuration = currentOption?.duration_minutes ?? svc.duration_minutes;

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      role="button"
      tabIndex={0}
      className="w-full text-left rounded-2xl border border-gray-200 bg-white p-5 transition-all cursor-pointer
        hover:[&:not(:has(.reservar-btn:hover))]:scale-[1.01]
        hover:[&:not(:has(.reservar-btn:hover))]:shadow-md"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-gray-900">
            {svc.name}
          </h3>
          {svc.description && (
            <p className="mt-0.5 text-sm text-gray-600 truncate">
              {svc.description}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {formatDurationLabel(effectiveDuration)} · {(effectivePrice / 100).toFixed(2).replace(".", ",")} €
            {hasOptions && <span className="ml-1 text-xs text-gray-400">(a partir de {(svc.price_cents / 100).toFixed(2).replace(".", ",")} €)</span>}
          </p>
        </div>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onReservarClick(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onReservarClick(); } }}
          className="reservar-btn shrink-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-accent text-lg text-black transition-transform hover:scale-110 hover:bg-accent hover:text-white"
        >
          +
        </span>
      </div>
      {hasOptions && (
        <div className="mt-3 flex flex-wrap gap-2">
          {svc.rental_options!.map((opt) => {
            const isActive = (currentVariantId ?? svc.rental_options![0].id) === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={(e) => { e.stopPropagation(); onRentalVariantChange?.(opt.id); }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-white"
                    : "bg-gray-100 text-gray-600 border border-gray-200 hover:border-accent"
                }`}
              >
                {formatDurationLabel(opt.duration_minutes)} · {(opt.price_cents / 100).toFixed(2).replace(".", ",")}€
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
