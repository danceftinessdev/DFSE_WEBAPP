# Supabase összekötés – lépésről lépésre

Ez a dokumentum leírja, hogyan kösd össze a Next.js alkalmazást egy Supabase projekttel (helyi vagy hosted), és hogyan kezeld a git verziókezelést.

## 1. Git

A repó inicializálva van (`git init`), az első commit megtörtént. A `.gitignore` kizárja a `node_modules`, `.next`, `.env*` (kivéve `.env*.example`) és a next-pwa generált fájlokat.

**Ha GitHub-ra szeretnéd tolni:**
```powershell
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

## 2. Supabase – két lehetőség

### A) Hosted (éles/dev) Supabase projekt

1. Hozz létre egy projektet a [supabase.com](https://supabase.com) dashboardon.
2. Másold ki a **Project URL**-t és az **anon public key**-t (Project Settings → API).
3. Hozd létre a `.env.local` fájlt a gyökérben (`.env.local.example` alapján):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
   ```
4. Kösd össze a CLI-t a projekttel és told fel a migrációt:
   ```powershell
   npm run supabase:link      # kéri a project ref-et (dashboard URL-ből)
   npm run supabase:push      # supabase/migrations/0001_init_schema.sql futtatása éles DB-n
   npm run supabase:types     # típusok generálása -> src/types/database.types.ts felülírása
   ```

### B) Helyi Supabase (Docker szükséges)

1. Indítsd el a Docker Desktopot.
2. Futtasd:
   ```powershell
   npm run supabase:start
   ```
   Ez elindítja a helyi Postgres/Auth/Storage stacket, és kiírja a helyi URL-t + anon key-t.
3. Másold be ezeket a `.env.local`-ba (lásd a `.env.local.example` alsó, kikommentezett sorait).
4. A migráció (`supabase/migrations/0001_init_schema.sql`) automatikusan lefut induláskor. Séma módosítás után:
   ```powershell
   npm run supabase:reset      # újra lefuttatja az összes migrációt tiszta DB-n
   npm run supabase:types
   ```
5. Leállítás: `npm run supabase:stop`.

## 3. Jelenlegi állapot ebben a repóban

- `supabase/config.toml` – helyi Supabase CLI konfiguráció (`supabase init` generálta).
- `supabase/migrations/0001_init_schema.sql` – teljes séma (lásd [01-database-schema.md](01-database-schema.md)).
- A Supabase CLI dev dependency-ként telepítve (`npm run supabase:*` szkriptek).
- **Docker jelenleg nem fut** ezen a gépen, ezért a helyi Supabase stack indítása még nem történt meg. Hosted projekt esetén nincs szükség Docker-re, csak a fenti A) lépésekre.
