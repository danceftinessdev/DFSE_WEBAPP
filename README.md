# DFSE Admin – Dance Fitness Sportegyesület

Weboldal és adminisztrációs felület a jászberényi **Dance Fitness Sportegyesület** (DFSE) számára.
A projekt Next.js 16, React 19, TypeScript és Tailwind CSS v4 alapokon épül.

## Mit tartalmaz

* **Nyilvános weboldal** (`/`, `/bemutatkozas`, `/kapcsolat`) – bemutatkozó oldalak látogatóknak.
* **Admin felület** (`/admin/...`) – tagok, órarend (naptár), statisztikák és profil kezelése,
  mobilbarát, összecsukható oldalsávval. Jelenleg minta (demó) adatokkal van feltöltve.
* Sötét/világos téma váltás, reszponzív elrendezés minden nézethez.

## Fejlesztői környezet

Előfeltétel: Node.js 20.x vagy újabb.

```bash
npm install
npm run dev
```

Az oldal ezután elérhető: [http://localhost:3000](http://localhost:3000)

Egyéb parancsok:

```bash
npm run build   # production build
npm run start   # production build futtatása
npm run lint    # ESLint ellenőrzés
```

## Mappaszerkezet

```
src/app/(site)/        Nyilvános oldalak (főoldal, bemutatkozás, kapcsolat)
src/app/admin/         Admin irányítópult (tagok, órarend, statisztikák, profil...)
src/app/(full-width-pages)/  Bejelentkezés / hibaoldalak
src/components/        Újrafelhasználható UI komponensek
src/layout/             Admin oldalsáv és fejléc
```

## Fontos – éles használat előtt

Ez a projekt jelenleg egy admin dashboard **sablon** (TailAdmin) alapján készült, kitöltve a DFSE
egyesületre szabott mintaadatokkal és szöveggel. Éles bevezetés előtt szükséges:

* **Valódi bejelentkezés/jogosultságkezelés** bekötése – jelenleg a `/signin` oldal csak vizuális
  demó, nincs mögötte működő azonosítás, így az `/admin` útvonalak nincsenek védve. Nyilvános
  regisztráció nincs, felhasználót csak admin/edző hozhat létre (pl. Supabase Studio-ban).
* **Adatbázis** bekötése a tagok, csoportok, órarend és tagdíjak valós kezeléséhez (a táblázatok és
  grafikonok most minta adatokat mutatnak).
* A `/kapcsolat` oldalon és a lábléceken szereplő elérhetőségek (cím, telefon, e-mail) lecserélése a
  ténylegesre.

## Licenc / eredet

A projekt a [TailAdmin](https://tailadmin.com) ingyenes, MIT licencű Next.js admin dashboard
sablonjából indult ki (lásd [LICENSE](./LICENSE)), a DFSE egyesület igényeire szabva.

