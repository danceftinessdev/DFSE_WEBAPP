"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-secondary/30 p-10 shadow-sm sm:p-16"
        >
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Készen állsz, hogy <span className="text-primary">csatlakozz</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground sm:text-lg">
            Regisztrálj, nézd meg az órarendünket, és találd meg a hozzád illő csoportot – kortól
            és szinttől függetlenül.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" nativeButton={false} render={<Link href="/register" />}>
              Csatlakozom <ArrowRight className="ml-2 size-4" />
            </Button>
            <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/orarend" />}>
              Órarend megtekintése
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
