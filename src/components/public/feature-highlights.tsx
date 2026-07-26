"use client";

import { motion } from "framer-motion";
import { Calendar, Newspaper, Trophy, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Calendar,
    title: "Dinamikus órarend",
    description: "Mindig naprakész, valós idejű órarend minden szintre és korosztályra.",
  },
  {
    icon: Trophy,
    title: "Versenyeredmények",
    description: "Kövesd nyomon versenyzőink eredményeit és felkészülését.",
  },
  {
    icon: Newspaper,
    title: "Friss hírek",
    description: "Egyesületi események, sikerek és fontos információk egy helyen.",
  },
  {
    icon: Users,
    title: "Közösség",
    description: "Kezdőktől a versenyzőkig – mindenki megtalálja a helyét nálunk.",
  },
];

export function FeatureHighlights() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          >
            <Card className="h-full">
              <CardHeader>
                <feature.icon className="mb-2 size-8 text-primary" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {feature.description}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
