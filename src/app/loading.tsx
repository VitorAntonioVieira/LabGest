import React from "react";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black">
      <div className="relative flex flex-col items-center gap-4">
        <div className="absolute -inset-6 rounded-full bg-emerald-500/20 blur-2xl animate-pulse" />
        <img
          src="/splash-icon.png"
          alt="Carregando..."
          className="relative h-20 w-20 sm:h-24 sm:w-24 object-contain rounded-2xl animate-pulse select-none"
        />
      </div>
    </div>
  );
}
