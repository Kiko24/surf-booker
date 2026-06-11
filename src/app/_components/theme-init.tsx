"use client";

import { useEffect } from "react";

export function ThemeInit() {
  useEffect(() => {
    const html = document.documentElement;

    const saved = localStorage.getItem("theme");
    if (saved === "light") {
      html.classList.add("light");
    } else {
      html.classList.remove("light");
    }

    const path = window.location.pathname;
    if (path.startsWith("/dashboard")) {
      html.classList.add("dashboard-scale");
    } else {
      html.classList.remove("dashboard-scale");
    }
  }, []);

  return null;
}
