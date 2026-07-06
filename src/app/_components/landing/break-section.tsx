"use client";

import Image from "next/image";
import { useRef, useState, useEffect, useCallback } from "react";
import breakImg from "@/components/images/break.png";

export function BreakSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [textVisible, setTextVisible] = useState(false);

  const textRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setTextVisible(true); o.disconnect(); } }, { threshold: 0.2 });
    o.observe(el);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const image = imageRef.current;
    if (!section || !image) return;
    if (isMobile) {
      image.style.transform = "none";
      return;
    }
    let ticking = false;
    const update = () => {
      const rect = section.getBoundingClientRect();
      const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      const clamped = Math.max(0, Math.min(1, progress));
      const offset = (clamped - 0.5) * 2 * section.offsetHeight * 0.5 * 0.5;
      image.style.transform = `translateY(${offset}px)`;
      ticking = false;
    };
    const onScroll = () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      image.style.transform = "none";
    };
  }, [isMobile]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden min-h-[250px] sm:min-h-[400px] flex items-center justify-center"
    >
      <div ref={imageRef} className="absolute inset-0 z-0 will-change-transform" style={{ top: "-10%", height: "120%" }}>
        <Image src={breakImg} alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
      </div>
      <div
        ref={textRef}
        className={`relative z-10 transition-all duration-700 ease-out ${textVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="text-center px-5 sm:px-8">
          <p className="text-[clamp(1rem,1.8vw,1.375rem)] font-semibold text-white">
            Deixa a gestão connosco.<br/>O surf é contigo.
          </p>
          <h2 className="mt-4 font-heading text-[clamp(1.5rem,3.5vw,3rem)] font-bold text-white whitespace-nowrap">
            Não, não é magia, é Alaia!
          </h2>
        </div>
      </div>
    </section>
  );
}
