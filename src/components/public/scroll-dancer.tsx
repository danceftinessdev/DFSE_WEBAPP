"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Egyedi, procedurálisan animált táncoló figura (SVG), amely a felhasználó
 * görgetése közben "táncol": a kar/láb szögek, a testdöntés és a fej
 * folyamatosan interpolálódnak a szekció scroll-progressze alapján.
 * Nincs külső Lottie asset-függőség, minden framer-motion transform.
 */
export function ScrollDancer() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Karok/lábak több "pózon" keresztül forognak a scroll előrehaladtával
  const leftArmRotate = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [-40, 60, -20, 80, -40]);
  const rightArmRotate = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [40, -70, 30, -50, 40]);
  const leftLegRotate = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [-15, 25, -30, 15, -15]);
  const rightLegRotate = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [15, -20, 30, -25, 15]);
  const torsoRotate = useTransform(scrollYProgress, [0, 0.5, 1], [-6, 6, -6]);
  const headRotate = useTransform(scrollYProgress, [0, 0.5, 1], [-10, 10, -10]);
  const bodyY = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const figureOpacity = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], [0, 1, 1, 0]);

  return (
    <section ref={sectionRef} className="relative h-[260vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-2 text-center md:order-1 md:text-left"
          >
            <span className="mb-3 inline-block rounded-full border bg-background/80 px-4 py-1 text-sm font-medium text-muted-foreground">
              Élő ritmus, élő mozgás
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              Minden görgetés egy <span className="text-primary">lépés</span> a táncparketten
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground sm:text-lg md:mx-0">
              Az energia, amit az edzéseinken átélsz, itt is érezhető – görgess lejjebb, és nézd,
              hogyan mozdul velünk minden pillanat.
            </p>
          </motion.div>

          <motion.div
            style={{ opacity: figureOpacity, y: bodyY }}
            className="order-1 flex items-center justify-center md:order-2"
          >
            <motion.svg
              viewBox="0 0 200 320"
              className="h-[60vh] max-h-[520px] w-auto text-primary"
              style={{ rotate: torsoRotate }}
            >
              {/* Fej */}
              <motion.circle
                cx="100"
                cy="42"
                r="22"
                fill="currentColor"
                style={{ rotate: headRotate, originX: "100px", originY: "42px" }}
              />
              {/* Törzs */}
              <rect x="88" y="62" width="24" height="90" rx="12" fill="currentColor" opacity="0.9" />

              {/* Bal kar */}
              <motion.g style={{ rotate: leftArmRotate, originX: "92px", originY: "78px" }}>
                <rect x="82" y="72" width="12" height="70" rx="6" fill="currentColor" opacity="0.8" />
              </motion.g>
              {/* Jobb kar */}
              <motion.g style={{ rotate: rightArmRotate, originX: "108px", originY: "78px" }}>
                <rect x="106" y="72" width="12" height="70" rx="6" fill="currentColor" opacity="0.8" />
              </motion.g>

              {/* Bal láb */}
              <motion.g style={{ rotate: leftLegRotate, originX: "94px", originY: "150px" }}>
                <rect x="86" y="150" width="14" height="100" rx="7" fill="currentColor" opacity="0.85" />
              </motion.g>
              {/* Jobb láb */}
              <motion.g style={{ rotate: rightLegRotate, originX: "106px", originY: "150px" }}>
                <rect x="100" y="150" width="14" height="100" rx="7" fill="currentColor" opacity="0.85" />
              </motion.g>
            </motion.svg>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
