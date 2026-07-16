import Image from "next/image";

export function HeroSection() {
  return (
    <section className="relative z-0 flex min-h-dvh items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image src="/images/hero-section.png" alt="" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-5 sm:px-8 max-w-3xl">
        <h1 className="font-heading text-[clamp(2.5rem,6.11vw,5.5rem)] font-bold leading-none tracking-tight text-white uppercase">
          Feito para<br/>
          <span className="text-accent">quem vive o mar.</span>
        </h1>
        <p className="mt-6 text-[clamp(1rem,1.528vw,1.375rem)] font-semibold text-white max-w-2xl">
          A plataforma de gestão para escolas de surf e desportos aquáticos.<br/>
          Os alunos reservam online, tu geres tudo num só lugar.
        </p>
        <a href="/user-flow" className="group mt-8 flex w-56 md:w-60 items-center justify-center rounded-full bg-accent px-8 py-3.5 shadow-lg transition-all duration-300 ease-out hover:shadow-xl hover:scale-[1.04] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-white">
          <span className="font-body text-sm font-semibold text-white uppercase">Começar já</span>
          <svg className="ml-2 h-4 w-4 text-white transition-transform duration-300 ease-out group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </section>
  );
}
