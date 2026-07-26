"use client";

import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

/**
 * Egyszerű, beépített (kód-alapú) táncoló pötty animáció loading state-hez,
 * amíg nincs végleges Lottie JSON asset a designtól.
 * Cseréld le a `public/lottie/*.json` fájlokra, ha elkészül a brand animáció.
 */
const dotsAnimation = {
  v: "5.9.6",
  fr: 30,
  ip: 0,
  op: 60,
  w: 200,
  h: 100,
  nm: "loading-dots",
  ddd: 0,
  assets: [],
  layers: [0, 1, 2].map((i) => ({
    ddd: 0,
    ind: i + 1,
    ty: 4,
    nm: `dot${i}`,
    sr: 1,
    ks: {
      o: {
        a: 1,
        k: [
          { t: i * 10, s: [30] },
          { t: i * 10 + 15, s: [100] },
          { t: i * 10 + 30, s: [30] },
        ],
      },
      p: { a: 0, k: [60 + i * 40, 50, 0] },
      s: { a: 0, k: [100, 100, 100] },
      r: { a: 0, k: 0 },
      a: { a: 0, k: [0, 0, 0] },
    },
    shapes: [
      {
        ty: "el",
        p: { a: 0, k: [0, 0] },
        s: { a: 0, k: [24, 24] },
      },
      {
        ty: "fl",
        c: { a: 0, k: [0.88, 0.11, 0.29, 1] },
        o: { a: 0, k: 100 },
      },
    ],
  })),
};

export function LottieLoader({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Lottie animationData={dotsAnimation} loop autoplay className="mx-auto h-24 w-48" />
    </div>
  );
}
