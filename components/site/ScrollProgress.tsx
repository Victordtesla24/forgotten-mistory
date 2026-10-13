
'use client';

import { motion, useScroll } from 'framer-motion';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="scroll-progress"
      data-scroll-progress
      aria-hidden="true"
      style={{ scaleX: scrollYProgress }}
    />
  );
}
