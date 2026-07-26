# Dance Fitness SE – Architektúra & Mappa/Fájlstruktúra terv (v1)

## Technológiai stack

- Next.js 14+ (App Router, RSC-first), TypeScript
- Tailwind CSS + shadcn/ui, dark/light mode (CSS változók)
- Framer Motion, lottie-react
- Supabase (Postgres, Auth, Storage, RLS)
- next-pwa (PWA / telepíthető natív élmény)
- TipTap (rich text hírekhez)
- Zod (validáció, minden form + API route)

## Tervezett mappastruktúra

```
/
├── docs/                                # Technikai dokumentáció (ez a mappa)
│   ├── 00-architecture.md
│   └── 01-database-schema.md
├── supabase/
│   └── migrations/
│       └── 0001_init_schema.sql
├── public/
│   ├── manifest.json                    # PWA manifest
│   ├── icons/
│   └── lottie/                          # easter egg animációk
├── src/
│   ├── app/
│   │   ├── (public)/                    # Publikus route group
│   │   │   ├── page.tsx                 # Landing page
│   │   │   ├── hirek/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── rolunk/page.tsx
│   │   │   ├── versenyzoink/page.tsx
│   │   │   ├── orarend/page.tsx
│   │   │   └── kapcsolat/page.tsx
│   │   ├── (auth)/                      # Bejelentkezés/regisztráció
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (admin)/                     # ERP – védett route group
│   │   │   ├── layout.tsx               # RBAC guard + admin nav
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── orarend/                 # ClassTypes, ScheduledClasses, Attendance
│   │   │   ├── versenyek/               # Competitions, participants, finance
│   │   │   ├── tagdijak/                # membership_fees
│   │   │   ├── versenyzok/              # CRM: athlete_profiles, GDPR
│   │   │   ├── ruhatar/                 # Wardrobe modul
│   │   │   ├── koreografiak/            # Choreographies, elements, rules
│   │   │   ├── hirek/                   # Hírek admin CRUD (TipTap editor)
│   │   │   └── felhasznalok/            # RBAC / permissions admin
│   │   ├── profilom/page.tsx            # Saját profil (user/parent/coach)
│   │   ├── api/                         # Route handlers (webhook, export, stb.)
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                          # shadcn/ui generált komponensek
│   │   ├── layout/                      # Header, Footer, AdminSidebar, MobileNav
│   │   ├── public/                      # Landing, Hírek kártya, Órarend nézet
│   │   ├── admin/                       # Táblázatok, form widgetek, dashboardok
│   │   └── shared/                      # AuthButton, ThemeToggle, LottieLoader
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                # Browser kliens
│   │   │   ├── server.ts                # Server kliens (RSC/Server Action)
│   │   │   └── middleware.ts            # Session frissítés
│   │   ├── validations/                 # Zod sémák modulonkánt
│   │   ├── rbac.ts                      # has_role/has_permission helperek
│   │   ├── rule-engine.ts               # Choreography validáció kliens oldali wrapper
│   │   └── utils.ts
│   ├── hooks/
│   ├── types/
│   │   └── database.types.ts            # Supabase generált típusok
│   └── middleware.ts                    # Auth session + route guard
├── next.config.js                       # next-pwa konfiguráció
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Route Group logika

- `(public)`: SSR/RSC, statikusan cache-elt tartalom ahol lehet (hírek, órarend ISR-rel).
- `(admin)`: middleware + layout szintű RBAC guard (`profiles.role` ellenőrzés Server Component-ben), minden almodul saját permission-check-kel (pl. `ruhatar` → `wardrobe.view/manage`).
- Feltételes "Bejelentkezés/Profilom/Admin" gomb: Server Component olvassa a session/role-t, kliens oldali interaktivitáshoz kis "use client" `AuthButton` komponens.

## Adatréteg elvek

- Minden admin form: Zod séma (`lib/validations/*.ts`) → Server Action → Supabase insert/update → automatikus audit log (DB trigger).
- Rule Engine hívás: Server Action a koreográfia elem hozzáadásakor meghívja a `validate_choreography_rules` RPC-t; hiba esetén a Zod-hoz hasonló strukturált hibaobjektumot ad vissza (`{ ruleId, ruleCode, description }`).

## Következő lépés

Jóváhagyás után: Next.js projekt inicializálása, Supabase kliens/típusgenerálás, majd a Landing page + Auth flow implementálása.
