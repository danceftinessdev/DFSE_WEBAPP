import type { Metadata } from "next";
import { GroupIcon } from "@/icons";

export const metadata: Metadata = {
  title: "Bemutatkozás",
  description:
    "Ismerd meg a Dance Fitness Sportegyesületet és a jászberényi tánc- és aerobik csoportjainkat.",
};

const groups = [
  { name: "Zumba", info: "Kezdő és haladó csoportok, minden korosztálynak." },
  { name: "Hip-Hop", info: "Gyerek és ifjúsági csoportok." },
  { name: "Balett", info: "Alapozó és haladó balett csoportok." },
  { name: "Aerobik", info: "Felnőtt csoportok, rendszeres heti órákkal." },
  { name: "Modern tánc", info: "Kifejező, kortárs táncstílus fiataloknak." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-title-sm font-bold text-gray-800 dark:text-white/90">
        Bemutatkozás
      </h1>
      <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
        A Dance Fitness Sportegyesület (DFSE) jászberényi székhelyű
        sportegyesület, amely tánc- és aerobik foglalkozásokat tart
        gyerekeknek, fiataloknak és felnőtteknek. Célunk, hogy mindenki
        megtalálja a hozzá illő csoportot, a kezdő lépésektől egészen a
        versenyzésig.
      </p>
      <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
        Csapatunk tapasztalt oktatókból áll, akik odafigyelnek minden tag
        egyéni fejlődésére, és rendszeres fellépéseken, versenyeken keresztül
        adnak lehetőséget a megmérettetésre.
      </p>

      <h2 className="mt-12 text-title-sm font-semibold text-gray-800 dark:text-white/90">
        Csoportjaink
      </h2>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {groups.map((group) => (
          <div
            key={group.name}
            className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10">
              <GroupIcon />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white/90">
                {group.name}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {group.info}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
