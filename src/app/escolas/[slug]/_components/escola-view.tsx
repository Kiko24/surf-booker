"use client";

import { useState } from "react";
import type { PublicSchoolData } from "../actions";
import { Lightbox } from "./lightbox";

type Props = {
  data: PublicSchoolData;
};

export function EscolaView({ data }: Props) {
  const { school, images, services } = data;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<PublicSchoolData["services"][number] | null>(null);

  return (
    <div className="bg-[#F7FAFC]">
      {/* Header */}
      <section className="px-5 pt-16 sm:px-8 sm:pt-24">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-heading text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-gray-900">
            {school.name}
          </h1>
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
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                    style={{ minHeight: 280 }}
                  />
                </button>

                {services.length > 0 && (
                  <div>
                    <h2 className="font-heading text-xl font-bold text-gray-900 mb-4">
                      Serviços
                    </h2>
                    <div className="space-y-3">
                      {services.map((svc) => (
                        <button
                          key={svc.id}
                          type="button"
                          onClick={() => setSelectedService(svc)}
                          className="w-full text-left rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md hover:scale-[1.01]"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-heading font-semibold text-gray-900">
                                {svc.name}
                              </h3>
                              {svc.description && (
                                <p className="mt-0.5 text-sm text-gray-600 truncate">
                                  {svc.description}
                                </p>
                              )}
                              <p className="mt-1 text-sm text-gray-500">{svc.duration_minutes} min &middot; {(svc.price_cents / 100).toFixed(2).replace(".", ",")} €</p>
                            </div>
                            <span className="shrink-0 rounded-full border-2 border-accent px-5 py-1.5 text-sm text-black">
                              Reservar
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Coluna direita: 2 fotos + info card */}
              <div className="flex flex-col gap-8 md:w-[35%]">
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
                        className="h-full w-full object-cover transition-transform hover:scale-105"
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
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                        style={{ height: "100%", objectFit: "cover" }}
                      />
                      <div className="absolute inset-0 flex items-end justify-center bg-black/30 rounded-xl pb-4">
                        <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow">
                          Ver mais fotos
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </button>
                  )}
                </div>
                <div className="rounded-xl bg-white p-5 shadow-sm md:mt-11">
                  <h3 className="font-heading font-semibold text-gray-900">
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
            <div className="flex items-start gap-6">
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-xl font-bold text-gray-900">
                  {selectedService.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500">{selectedService.duration_minutes} min</p>
                {selectedService.description && (
                  <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                    {selectedService.description}
                  </p>
                )}
                <p className="mt-2 font-heading text-lg font-bold text-gray-900">
                  {(selectedService.price_cents / 100).toFixed(2).replace(".", ",")} €
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-full border-2 border-accent px-5 py-2 text-sm text-black transition-all hover:scale-[1.04]"
              >
                Reservar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
