"use client";

import { useState } from "react";
import { Navbar } from "@/app/_components/landing/navbar";
import { HeroSection } from "@/app/_components/landing/hero-section";
import { ComoFuncionaSection } from "@/app/_components/landing/como-funciona-section";
import { BreakSection } from "@/app/_components/landing/break-section";
import { FeaturesSection } from "@/app/_components/landing/features-section";
import { CalendarModal } from "@/app/_components/landing/calendar-modal";
import { FaqSection } from "@/app/_components/landing/faq-section";
import { ContactoSection } from "@/app/_components/landing/contacto-section";
import { FooterSection } from "@/app/_components/landing/footer-section";

type UserInfo = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export function LandingPageView({ user }: { user: UserInfo | null }) {
  const [showCalendar, setShowCalendar] = useState(false);

  return (
    <div className="bg-[#F7FAFC]">
      <Navbar user={user} />
      <HeroSection />
      <ComoFuncionaSection />
      <BreakSection />
      <FeaturesSection />
      <CalendarModal open={showCalendar} onClose={() => setShowCalendar(false)} />
      <FaqSection />
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>
      <ContactoSection onOpenCalendar={() => setShowCalendar(true)} />
      <FooterSection />
    </div>
  );
}
