"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { PublicSchoolData } from "../actions";
import { toggleFavorite } from "../actions";
import { Lightbox } from "./lightbox";
import { BookingModal } from "./booking-modal";
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
  const [bookingSession, setBookingSession] = useState<PublicSchoolData["upcomingSessions"][number] | null>(null);
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
  const [selectedSession, setSelectedSession] = useState<PublicSchoolData["upcomingSessions"][number] | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [displayCount, setDisplayCount] = useState(10);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [favorited, setFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; phone: string } | null>(null);

  const [packName, setPackName] = useState("");
  const [packEmail, setPackEmail] = useState("");
  const [packPhone, setPackPhone] = useState("");
  const [packFormError, setPackFormError] = useState<string | null>(null);
  const [packQuantity, setPackQuantity] = useState(1);

  useEffect(() => {
    if (!showServicePicker) return;
    setPackQuantity(1);
    setPackFormError(null);
  }, [showServicePicker]);

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
      {images.length > 0 && (
        <section className="px-5 pt-8 pb-8 sm:px-8 sm:pb-12">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-start">
              {/* Coluna esquerda: foto grande + serviços */}
              <div className="flex flex-col gap-8 md:w-[65%]">
                <button
                  type="button"
                  onClick={() => setLightboxIndex(0)}
                  className="overflow-hidden rounded-xl md:h-[420px]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images[0].public_url}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ minHeight: 280 }}
                  />
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
                        <ServiceCard key={svc.id} svc={svc} onClick={() => setSelectedService(svc)} onReservarClick={() => { setSelectedServiceId(svc.id); setShowServicePicker(true); }} />
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

                {instructors.length > 0 && (
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-gray-900 mb-4">
                      Instrutores
                    </h2>
                    <div className="flex flex-wrap gap-6">
                      {instructors.map((inst, i) => (
                        <div key={i} className="flex flex-col items-center text-center w-[calc(50%-12px)] sm:w-[calc(25%-18px)]">
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

              {/* Coluna direita: 2 fotos + info card */}
              <div className="flex flex-col gap-6 md:w-[35%]">
                <div className="flex flex-col gap-3 md:h-[420px]">
                  {images[1] && (
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(1)}
                      className="overflow-hidden rounded-xl flex-1 h-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={images[1].public_url}
                        alt=""
                        className="h-full w-full object-cover"
                        style={{ height: "100%", objectFit: "cover" }}
                      />
                    </button>
                  )}
                  {images[2] && (
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(2)}
                      className="overflow-hidden rounded-xl flex-1 h-0 relative"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={images[2].public_url}
                        alt=""
                        className="h-full w-full object-cover"
                        style={{ height: "100%", objectFit: "cover" }}
                      />
                      <div className="absolute inset-0 flex items-end justify-center bg-black/30 rounded-xl pb-4">
                        <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow transition-transform hover:scale-105">
                          Ver mais fotos
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </button>
                  )}
                </div>
                <div className="rounded-xl bg-white p-5 shadow-sm md:mt-14">
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
              </div>
            </div>
          </div>
        </section>
      )}

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
                <p className="mt-1 text-sm text-gray-500">
                  {selectedService.duration_minutes} min
                </p>
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

      {showServicePicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowServicePicker(false)}
        >
          <div
            className="w-full max-w-5xl rounded-2xl bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="font-heading text-lg font-bold text-gray-900">
                Reservar aula
              </h3>
              <button
                type="button"
                onClick={() => setShowServicePicker(false)}
                className="rounded-full bg-gray-100 p-2 text-gray-500 transition-colors hover:bg-gray-200"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
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

            {/* Services + Calendar */}
            <div className="flex flex-row gap-6">
              {/* Services list */}
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-2">
                  {filteredServices.map((svc) => {
                    const isSelected = selectedServiceId === svc.id;
                    const ctaLabel =
                      svc.category === "pack" ? "Comprar"
                      : svc.category === "aluguer" ? "Alugar"
                      : "Reservar";
                    const showCalendar = svc.category === "aula";

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
                            {svc.duration_minutes} min &middot; {(svc.price_cents / 100).toFixed(2).replace(".", ",")} €
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedServiceId(null);
                            } else {
                              setSelectedServiceId(svc.id);
                              if (!showCalendar) {
                                setSelectedSession(null);
                              }
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
                        classTypeFilter={rightSvc.name}
                        onSelectSession={(session) => setSelectedSession(session)}
                      />
                    );
                  }
                  if (rightSvc.category === "pack" || rightSvc.category === "aluguer") {
                    return (
                      <div className="space-y-3">
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
                  return <div />;
                })()}
              </div>
            </div>

            {/* Bottom bar: selected service info + Continuar */}
            {(() => {
              const selSvc = services.find(s => s.id === selectedServiceId);
              if (!selectedServiceId || !selSvc) return null;
              const isAula = selSvc.category === "aula";
              const isPack = selSvc.category === "pack" || selSvc.category === "aluguer";
              const qty = isPack ? packQuantity : 1;
              const priceCents = selectedSession ? selectedSession.price_cents : selSvc.price_cents;
              const displayPrice = isPack ? priceCents * qty : priceCents;
              const itemName = selectedSession ? selectedSession.class_type_name : selSvc.name;
              const sessionTime = selectedSession
                ? (() => {
                    const d = new Date(selectedSession.starts_at);
                    const day = d.getDate().toString().padStart(2, "0");
                    const month = (d.getMonth() + 1).toString().padStart(2, "0");
                    const year = d.getFullYear();
                    const time = d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
                    return `${day}/${month}/${year}, ${time}`;
                  })()
                : null;
              const canContinue = isAula ? !!selectedSession : (packName.trim().length >= 2 && packEmail.trim().includes("@") && packPhone.trim().length >= 6);

              const handleContinue = () => {
                if (isAula && selectedSession) {
                  setShowBookingForm(true);
                } else if (isPack) {
                  const name = packName.trim();
                  const email = packEmail.trim();
                  const phone = packPhone.trim();
                  if (name.length < 2) { setPackFormError("Nome deve ter pelo menos 2 caracteres."); return; }
                  if (!email.includes("@") || !email.includes(".")) { setPackFormError("Email inválido."); return; }
                  if (phone.length < 6) { setPackFormError("Telemóvel deve ter pelo menos 6 dígitos."); return; }
                  setPackFormError(null);
                  setShowBookingForm(true);
                }
              };

              return (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-sm text-gray-900">
                    <span>{qty > 1 ? `${qty}x ` : ""}{itemName}</span>
                    <span className="mx-1.5">=</span>
                    <span className="font-semibold">{(displayPrice / 100).toFixed(2).replace(".", ",")} €</span>
                    {sessionTime && <span className="mx-1.5">·</span>}
                    {sessionTime && <span>{sessionTime}</span>}
                  </p>
                  <button
                    type="button"
                    disabled={!canContinue}
                    onClick={handleContinue}
                    className={`rounded-full border-2 px-6 py-2 text-sm transition-all ${
                      canContinue
                        ? "border-accent text-black hover:scale-105 hover:bg-accent hover:text-white"
                        : "border-gray-200 text-gray-300"
                    }`}
                  >
                    Continuar
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {showBookingForm && selectedSession && (
        <BookingModal
          sessionId={selectedSession.id}
          schoolId={school.id}
          onClose={() => { setShowBookingForm(false); setShowServicePicker(false); }}
        />
      )}

      {bookingSession && (
        <BookingModal
          sessionId={bookingSession.id}
          schoolId={school.id}
          onClose={() => setBookingSession(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-gray-700 bg-gray-800 px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            {/* Brand */}
            <div className="max-w-xs">
              <a href="/" className="font-heading text-xl font-bold text-white">
                Alaia
              </a>
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

function ServiceCard({ svc, onClick, onReservarClick }: { svc: PublicSchoolData["services"][number]; onClick: () => void; onReservarClick: () => void }) {
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
          <p className="mt-1 text-sm text-gray-500">{svc.duration_minutes} min &middot; {(svc.price_cents / 100).toFixed(2).replace(".", ",")} €</p>
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
    </div>
  );
}
