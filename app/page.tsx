'use client';

import { useEffect } from 'react';
import { motion, useScroll } from 'framer-motion';

import Hero from '@/components/sections/Hero/Hero';
import About from '@/components/sections/About/About';
import Experience from '@/components/sections/Experience/Experience';
import Skills from '@/components/sections/Skills/Skills';
import Vitrine from '@/components/sections/Vitrine/Vitrine';
import Listen from '@/components/sections/Listen/Listen';
import Navigation from '@/components/site/Navigation';

/**
 * The page is a composition and nothing else.
 *
 * It was 783 lines: five sections written inline, thirty component imports, a
 * preloader handshake, two deferred-mount gates and a credibility band that
 * restated figures the sections below it already carried. Each section now owns
 * its own markup, styles, data and scene, so this file's only remaining jobs are
 * to order them and to raise the one signal the rest of the app still listens
 * for.
 */
export default function Home() {
  // `page-ready` was the preloader's handoff signal. The preloader is gone — the
  // hero is server-rendered and reveals itself in CSS — but the class and the
  // event are still what MiniVicBot and the test suite key on, so the page
  // raises them itself on the frame after mount.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      document.body.classList.add('page-ready');
      window.dispatchEvent(new Event('fm:page-ready'));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Whole-document progress drives the slim reading indicator pinned to the top edge.
  const { scrollYProgress: pageProgress } = useScroll();



  return (
    <>
      <motion.div
        className="scroll-progress"
        data-scroll-progress
        aria-hidden="true"
        style={{ scaleX: pageProgress }}
      />
      <Navigation />

      <main id="main">
        <Hero />

        <About />

        <Experience />

        <Skills />

        <Vitrine />

        <Listen />
      </main>
    </>
  );
}
