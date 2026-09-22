import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { name: "Főoldal", href: "/" },
  { name: "Bemutatkozás", href: "/bemutatkozas" },
  { name: "Kapcsolat", href: "/kapcsolat" },
];

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo/logo.svg"
              alt="DFSE logó"
              width={154}
              height={32}
              className="h-7 w-auto dark:hidden"
            />
            <Image
              src="/images/logo/logo-dark.svg"
              alt="DFSE logó"
              width={154}
              height={32}
              className="hidden h-7 w-auto dark:block"
            />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-700 hover:text-brand-500 dark:text-gray-300 dark:hover:text-brand-400"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              Bejelentkezés
            </Link>
          </div>

          {/* Mobile menu - uses a native <details> disclosure, no client JS needed */}
          <details className="md:hidden">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300">
              <svg
                width="20"
                height="14"
                viewBox="0 0 20 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0 1H20"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M0 7H20"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M0 13H20"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </summary>
            <nav className="absolute inset-x-0 top-full flex flex-col gap-1 border-t border-gray-200 bg-white px-4 py-3 shadow-theme-md dark:border-gray-800 dark:bg-gray-900">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/signin"
                className="mt-1 flex min-h-11 items-center justify-center rounded-lg bg-brand-500 px-3 py-2 text-center text-sm font-medium text-white hover:bg-brand-600"
              >
                Bejelentkezés
              </Link>
            </nav>
          </details>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div>
              <p className="text-base font-semibold text-gray-800 dark:text-white/90">
                Dance Fitness Sportegyesület
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Tánc és aerobik foglalkozások Jászberényben, minden korosztály
                számára.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Elérhetőség
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                <li>Jászberény, Fő tér 1.</li>
                <li>
                  <a href="mailto:info@dfse.hu" className="inline-flex min-h-11 items-center hover:text-brand-500">
                    info@dfse.hu
                  </a>
                </li>
                <li>
                  <a href="tel:+36301234567" className="inline-flex min-h-11 items-center hover:text-brand-500">
                    +36 30 123 4567
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Oldalak
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="inline-flex min-h-11 items-center hover:text-brand-500">
                      {link.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/signin" className="inline-flex min-h-11 items-center hover:text-brand-500">
                    Belépés tagoknak
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <p className="mt-8 border-t border-gray-200 pt-6 text-center text-xs text-gray-400 dark:border-gray-800">
            &copy; {new Date().getFullYear()} Dance Fitness Sportegyesület –
            Jászberény
          </p>
        </div>
      </footer>
    </div>
  );
}
