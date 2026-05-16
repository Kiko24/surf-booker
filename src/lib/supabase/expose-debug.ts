"use client";

import { useEffect } from "react";
import { createClient } from "./client";

export function ExposeSupabaseDebug() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      (window as any).supabase = createClient();
      console.log("🔧 supabase exposto em window.supabase (DEV ONLY)");
    }
  }, []);
  return null;
}