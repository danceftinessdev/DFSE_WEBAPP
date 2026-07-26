"use client";

import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Teljes oldalas, fixen rögzített parallax háttér: elmosott, színes
 * "blob" alakzatok, amelyek a scroll pozíció alapján különböző
 * sebességgel mozognak, mélységérzetet adva a görgetésnek.
 */
export function ParallaxBackground() {
  const { scrollYProgress } = useScroll();

  const ySlow = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const yMedium = useTransform(scrollYProgress, [0, 1], [0, -260]);
  const yFast = useTransform(scrollYProgress, [0, 1], [0, 380]);
  const rotateSlow = useTransform(scrollYProgress, [0, 1], [0, 45]);
  const rotateFast = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        style={{ y: yMedium, rotate: rotateSlow }}
        className="absolute -top-24 -left-24 size-[32rem] rounded-full bg-primary/15 blur-3xl"
      />
      <motion.div
        style={{ y: yFast, rotate: rotateFast }}
        className="absolute top-1/3 -right-32 size-[26rem] rounded-full bg-primary/10 blur-3xl"
      />
      <motion.div
        style={{ y: ySlow }}
        className="absolute bottom-0 left-1/4 size-[24rem] rounded-full bg-secondary/40 blur-3xl dark:bg-secondary/20"
      />
      <motion.div
        style={{ y: yFast }}
        className="absolute top-[60%] left-[10%] size-64 rounded-full bg-primary/10 blur-2xl"
      />
      {/* finom pontrács a mélységérzethez */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--foreground)_1px,transparent_1px)] opacity-[0.03] [background-size:28px_28px]" />
    </div>
  );
}
