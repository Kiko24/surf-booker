"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import { z } from "zod";
import demoImg from "@/components/images/demo.png";

const CONTACT_SCHEMA = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(80, "Máximo 80 caracteres"),
  email: z.string().trim().toLowerCase().email("Email inválido").max(160),
  message: z.string().trim().max(500, "Máximo 500 caracteres").optional(),
});

export function ContactoSection({ onOpenCalendar }: { onOpenCalendar: () => void }) {
  const [visible, setVisible] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const ref = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); o.disconnect(); } }, { threshold: 0.15 });
    o.observe(el);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = CONTACT_SCHEMA.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
  }

  return (
    <section id="contacto" className="relative overflow-hidden px-5 py-16 sm:px-8 sm:py-24 bg-gradient-to-b from-white to-gray-50">
      <div
        ref={ref}
        className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="mx-auto max-w-4xl relative z-10">
          <h2 className="font-heading text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-gray-900 text-center">
            Ainda estás reticente?
          </h2>
          <p className="mt-1 text-[clamp(1rem,1.3vw,1.125rem)] text-gray-600 text-center">
            Tira as tuas dúvidas connosco
          </p>
          <div className="mt-12 flex flex-col md:flex-row gap-6 items-stretch">
            <div className="flex-1">
              <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-md h-full">
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-800 mb-1">Nome</label>
                      <input type="text" placeholder="O teu nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light shadow-sm" />
                      {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-800 mb-1">Email</label>
                      <input type="email" placeholder="o teu@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={160} className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light shadow-sm" />
                      {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Mensagem</label>
                    <textarea placeholder="O que te traz até nós?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={500} rows={3} className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light shadow-sm resize-none min-h-[100px]" />
                    {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
                  </div>
                  <div className="text-center">
                    <button type="submit" className="group mx-auto inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-black shadow-sm w-[200px] transition-all duration-300 ease-out hover:shadow-md hover:scale-[1.04] hover:-translate-y-0.5">
                      Enviar
                      <svg className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="hidden md:block w-px self-stretch bg-gradient-to-b from-transparent via-gray-200 to-transparent flex-shrink-0" />

            <div className="flex-1">
              <div className="relative overflow-hidden rounded-2xl shadow-md h-full flex flex-col items-center text-center p-6 sm:p-8">
                <div className="absolute inset-0 z-0">
                  <Image src={demoImg} alt="" fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60" />
                </div>
                <div className="relative z-10 flex flex-col items-center flex-1 w-full">
                  <h3 className="font-heading text-lg font-bold text-white">Explora a Alaia</h3>
                  <p className="mt-1 text-sm text-white/80 max-w-xs">Fala connosco em direto e nós orquestramos-te a visita. Depois decides se é para ti</p>
                  <div className="mt-auto pt-6">
                    <button
                      onClick={onOpenCalendar}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-all duration-300 ease-out hover:shadow-md hover:scale-[1.04] hover:-translate-y-0.5"
                    >
                      Agendar demonstração
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
