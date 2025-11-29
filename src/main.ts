import "./style.css";
import initBackground from "./background";
import { gsap } from "gsap";

const cleanup = initBackground();

const runEntryAnimation = () => {
  const targets = Array.from(document.querySelectorAll("h1, p, .card"));
  if (!targets.length) return;

  gsap.from(targets, {
    y: 30,
    opacity: 0,
    duration: 1,
    stagger: 0.2,
    ease: "power3.out",
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runEntryAnimation, { once: true });
} else {
  runEntryAnimation();
}

// Expose cleanup if needed elsewhere.
(window as any).__CONSTELLATION_CLEANUP__ = cleanup;
