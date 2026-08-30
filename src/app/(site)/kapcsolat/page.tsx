import type { Metadata } from "next";
import { EnvelopeIcon, TimeIcon } from "@/icons";

export const metadata: Metadata = {
  title: "Kapcsolat",
  description:
    "Elérhetőségeink és fogadóóráink – Dance Fitness Sportegyesület, Jászberény.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-title-sm font-bold text-gray-800 dark:text-white/90">
        Kapcsolat
      </h1>
      <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
        Kérdésed van egy csoporttal, jelentkezéssel vagy a tagdíjjal
        kapcsolatban? Vedd fel velünk a kapcsolatot az alábbi elérhetőségeken.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10">
            <EnvelopeIcon />
          </div>
          <p className="mt-4 font-semibold text-gray-800 dark:text-white/90">
            E-mail
          </p>
          <a
            href="mailto:info@dfse.hu"
            className="mt-1 block text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400"
          >
            info@dfse.hu
          </a>
          <p className="mt-4 font-semibold text-gray-800 dark:text-white/90">
            Telefon
          </p>
          <a
            href="tel:+36301234567"
            className="mt-1 block text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400"
          >
            +36 30 123 4567
          </a>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10">
            <TimeIcon />
          </div>
          <p className="mt-4 font-semibold text-gray-800 dark:text-white/90">
            Cím
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Jászberény, Fő tér 1.
          </p>
          <p className="mt-4 font-semibold text-gray-800 dark:text-white/90">
            Ügyfélfogadás
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Hétfő–Péntek: 16:00–19:00
          </p>
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-400">
        A fenti elérhetőségek ideiglenes minta adatok – frissítsd a tényleges
        elérhetőségeitekkel.
      </p>
    </div>
  );
}
