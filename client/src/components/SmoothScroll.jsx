import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function SmoothScroll({ children }) {
  const location = useLocation();
  const lenisRef = useRef(null);
  const tickerRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      document.documentElement.classList.remove("lenis", "lenis-smooth");
      return undefined;
    }

    if (lenisRef.current) {
      lenisRef.current.destroy();
      lenisRef.current = null;
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.35
    });
    lenisRef.current = lenis;
    document.documentElement.classList.add("lenis", "lenis-smooth");

    lenis.on("scroll", (e) => {
      ScrollTrigger.update();
      window.dispatchEvent(new CustomEvent("lenis-scroll", { detail: { scroll: e.scroll } }));
    });

    const ticker = (time) => {
      lenis.raf(time * 1000);
    };
    tickerRef.current = ticker;
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      if (tickerRef.current) gsap.ticker.remove(tickerRef.current);
      tickerRef.current = null;
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      document.documentElement.classList.remove("lenis", "lenis-smooth");
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    const frame = window.requestAnimationFrame(() => {
      ScrollTrigger.getAll()
        .filter((t) => t.vars?.id === "data-reveal")
        .forEach((t) => t.kill());

      const reveals = gsap.utils.toArray("[data-reveal]");
      reveals.forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none",
              id: "data-reveal"
            }
          }
        );
      });
      ScrollTrigger.refresh();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname]);

  return children;
}
