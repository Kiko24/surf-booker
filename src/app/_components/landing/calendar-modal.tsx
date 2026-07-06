"use client";

export function CalendarModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 pb-0 pt-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">Agendar demonstração</h3>
        <iframe
          src="https://calendly.com/fmagalhes45/30min"
          width="100%"
          height="450"
          frameBorder="0"
          className="rounded-lg"
        />
      </div>
    </div>
  );
}
