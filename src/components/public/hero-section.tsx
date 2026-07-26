"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/10 via-background to-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-24 text-center md:py-32">
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
      </div>
    </section>
  );
}
