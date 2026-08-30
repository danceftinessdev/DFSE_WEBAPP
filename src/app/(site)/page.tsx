import Link from "next/link";
import { CheckCircleIcon, GroupIcon, CalenderIcon } from "@/icons";

const classes = [
  {
    name: "Zumba",
    description: "Latin ritmusú, jó hangulatú tánc-fitness óra minden szinten.",
  },
  {
    name: "Hip-Hop",
    description: "Dinamikus utcai tánc stílus gyerekeknek és fiataloknak.",
  },
  {
    name: "Balett",
    description: "Klasszikus balett alapok tartás- és mozgásfejlesztéssel.",
  },
  {
    name: "Aerobik",
    description: "Energikus, zenés mozgásforma az állóképesség fejlesztésére.",
  },
];

const highlights = [
  "Tapasztalt, képzett oktatók",
  "Csoportok minden korosztálynak, kezdőtől a versenyzőig",
  "Családias, támogató közösség",
  "Rendszeres fellépések és versenyek",
];

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-title-sm font-bold text-gray-800 dark:text-white/90 sm:text-title-lg">
            Dance Fitness Sportegyesület
          </h1>
          <p className="mt-4 text-base text-gray-500 dark:text-gray-400 sm:text-lg">
            Tánc és aerobik foglalkozások Jászberényben – gyerekeknek,
            fiataloknak és felnőtteknek, minden szinten.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/bemutatkozas"
              className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              Csoportjaink
            </Link>
            <Link
              href="/kapcsolat"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Kapcsolat
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-gray-50 py-16 dark:border-gray-800 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-title-sm font-semibold text-gray-800 dark:text-white/90">
            Óráink
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {classes.map((item) => (
              <div
                key={item.name}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10">
                  <GroupIcon />
                </div>
                <h3 className="mt-4 font-semibold text-gray-800 dark:text-white/90">
                  {item.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
              Miért válassz minket?
            </h2>
            <ul className="mt-6 space-y-4">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 text-success-500">
                    <CheckCircleIcon />
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10">
              <CalenderIcon />
            </div>
            <h3 className="mt-4 font-semibold text-gray-800 dark:text-white/90">
              Csatlakozz hozzánk!
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Vedd fel velünk a kapcsolatot, és megtaláljuk a hozzád legjobban
              illő csoportot.
            </p>
            <Link
              href="/kapcsolat"
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              Kapcsolatfelvétel
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
