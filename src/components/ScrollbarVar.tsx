"use client";

import { useEffect } from "react";

// Measures the vertical scrollbar width and publishes it as --sb on the
// root element. Fixed bottom bars use `pr-[var(--sb)]` so their inner
// content centers within the same width as main (which sits inside
// html's scrollbar-narrowed clientWidth).
export function ScrollbarVar() {
  useEffect(() => {
    function set() {
      const root = document.documentElement;
      const sb = Math.max(0, window.innerWidth - root.clientWidth);
      root.style.setProperty("--sb", `${sb}px`);
    }
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);
  return null;
}
