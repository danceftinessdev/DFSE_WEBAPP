"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";

export function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const contentY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <section
      ref={sectionRef}
      className="relative h-[100vh] min-h-[640px] overflow-hidden border-b bg-gradient-to-b from-primary/10 via-background to-background"
    >
      <motion.div
        style={{ y: contentY, opacity: contentOpacity, scale }}
        className="mx-auto flex h-full max-w-6xl flex-col items-center justify-center gap-6 px-4 text-center"
      >
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-full border bg-background/80 px-4 py-1 text-sm font-medium text-muted-foreground"
        >
          Tánc &amp; Fitnesz Sportegyesület
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl"
        >
          Mozdulj velünk. <span className="text-primary">Versenyezz</span> velünk.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-xl text-balance text-muted-foreground sm:text-lg"
        >
          A Dance Fitness SE otthont ad kezdő és versenyző táncosoknak egyaránt. Nézd meg az
          órarendünket, ismerd meg versenyzőinket, és csatlakozz hozzánk!
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <Button size="lg" nativeButton={false} render={<Link href="/orarend" />}>
            Órarend megtekintése <ArrowRight className="ml-2 size-4" />
          </Button>
          <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/kapcsolat" />}>
            Kapcsolatfelvétel
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-muted-foreground"
      >
        <ChevronDown className="size-6" />
      </motion.div>
    </section>
  );
}
