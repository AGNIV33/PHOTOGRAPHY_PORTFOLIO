"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Smooth, eased scrolling across the public website (Lenis).
// - Off for people who asked their device to reduce motion.
// - On everywhere, the dashboard included. Scrolling inside a list or a box that scrolls on
//   its own (marked data-lenis-prevent, or a normal scrollable box) stays native.
// - Paused while the loading iris is on screen, so the page can't be scrolled behind it.
export function SmoothScroll() {
  const pathname = usePathname();
  const lenis = useRef<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let instance: Lenis;
    try {
      // allowNestedScroll: a box that can scroll on its own (a long text box, a list) scrolls
      // normally while the pointer is over it.
      instance = new Lenis({ lerp: 0.1, smoothWheel: true, allowNestedScroll: true });
    } catch {
      return; // never let a scrolling effect break the page
    }
    lenis.current = instance;
    let frame = requestAnimationFrame(function loop(time) {
      instance.raf(time);
      frame = requestAnimationFrame(loop);
    });
    const lock = () => instance.stop();
    const unlock = () => instance.start();
    window.addEventListener("iris:show", lock);
    window.addEventListener("iris:hide", unlock);
    if (document.querySelector('.iris-loader[data-on="1"]')) instance.stop();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("iris:show", lock);
      window.removeEventListener("iris:hide", unlock);
      instance.destroy();
      lenis.current = null;
    };
  }, []);

  // A new page can be a different height.
  useEffect(() => {
    lenis.current?.resize();
  }, [pathname]);

  return null;
}
