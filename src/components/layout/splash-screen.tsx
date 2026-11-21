"use client";

import React, { useState, useEffect } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    try {
      const alreadyShown = window.sessionStorage.getItem("labgest_splash_shown") === "true";
      if (alreadyShown) {
        setVisible(false);
        return;
      }
      window.sessionStorage.setItem("labgest_splash_shown", "true");
    } catch {
      // Continua normalmente caso sessionStorage esteja indisponível
    }

    const fadeTimer = window.setTimeout(() => {
      setFadingOut(true);
    }, 900);

    const hideTimer = window.setTimeout(() => {
      setVisible(false);
    }, 1350);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-label="Tela de carregamento"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-500 ease-out ${
        fadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="relative flex flex-col items-center gap-5">
        {/* Glow suave verde ao fundo do ícone */}
        <div className="absolute -inset-6 rounded-full bg-emerald-500/20 blur-2xl animate-pulse" />

        <img
          src="/splash-icon.png"
          alt="Ícone Splash Screen"
          className="relative h-24 w-24 sm:h-28 sm:w-28 object-contain rounded-2xl animate-in zoom-in-90 fade-in duration-500 select-none"
        />

        {/* Barra de carregamento minimalista */}
        <div className="h-1 w-28 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full w-full origin-left animate-pulse rounded-full bg-emerald-500" />
        </div>
      </div>
    </div>
  );
}
