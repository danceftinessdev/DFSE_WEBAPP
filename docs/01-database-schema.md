# Dance Fitness SE – Adatbázis Séma (v1)

Ez a dokumentum a `supabase/migrations/0001_init_schema.sql` fájlban definiált teljes adatbázis-sémát írja le. A séma PostgreSQL/Supabase alapú, RLS-szel (Row Level Security) védett, teljes körű audit naplózással.

## Tartalomjegyzék

1. [Alapelvek](#alapelvek)
2. [RBAC – Jogosultságkezelés](#rbac--jogosultságkezelés)
3. [Audit Log](#audit-log)
4. [Hírek modul](#hírek-modul)
5. [Versenyzők bemutatása](#versenyzők-bemutatása)
6. [Órarend & Jelenléti ív](#órarend--jelenléti-ív)
7. [Verseny & Pénzügy](#verseny--pénzügy)
8. [Versenyzői profil (CRM) & GDPR](#versenyzői-profil-crm--gdpr)
9. [Wardrobe (Ruházat)](#wardrobe-ruházat)
10. [Koreográfia & Rule Engine](#koreográfia--rule-engine)
11. [RLS összegzés](#rls-összegzés)

---

## Alapelvek

- **Soft delete**: nincs `DELETE` a statisztikailag releváns táblákon (órák, jelenlét, befizetés). Helyette `is_active` / `status` oszlop.
- **GDPR anonimizálás**: `anonymize_profile(uuid)` RPC függvény törli a személyes adatokat (`profiles.first_name`, `email`, stb.), de a rekord (és a hozzá kapcsolt statisztikai adatok, pl. jelenlét, befizetés) megmarad `gdpr_anonymized = true` jelzéssel.
- **Audit Trail**: minden kritikus táblán `audit_trigger_fn()` trigger fut `INSERT/UPDATE/DELETE`-re, ami a régi/új JSON állapotot és a módosító `auth.uid()`-ját menti az `audit_logs` táblába.
- **Indexelés**: minden idegen kulcs, gyakran szűrt/rendezett oszlop (dátum, státusz, slug, email) indexelve van.

## RBAC – Jogosultságkezelés

| Tábla | Szerep |
|---|---|
| `profiles` | 1:1 `auth.users`-szel, alap személyes adatok |
| `user_roles` | `user`, `parent`, `coach`, `admin` – többszörös role/user |
| `permissions` | egyedi jogosultság-kódok (pl. `finance.view`, `wardrobe.manage`) |
| `user_permissions` | moduláris, egyedileg adható jogosultságok edzőknek |
| `parent_child_links` | szülő ↔ több diák reláció |

Helper SQL függvények (`security definer`, RLS policy-kben használva): `has_role()`, `has_permission()`, `is_admin()`.

## Audit Log

`audit_logs(table_name, record_id, action, old_data, new_data, changed_by, changed_at)` – generikus trigger minden fontos táblán. Csak admin olvashatja (RLS).

## Hírek modul

`news_posts` (TipTap JSON `content`, `slug` egyedi, `is_published`), `news_references` (források listája). Trigram index a címen kereséshez.

## Versenyzők bemutatása

`athletes_showcase` – publikus, `sort_order` szerint rendezett kirakat.

## Órarend & Jelenléti ív

- `class_types` – óratípusok (pl. Kezdő Hip-Hop)
- `scheduled_classes` – konkrét naptári órák, `status` (`scheduled/cancelled/completed`)
- `attendance` – diák + óra egyedi pár, `status` (`present/absent/excused/late`)

## Verseny & Pénzügy

- `competitions` – versenyesemények
- `competition_participants` – jelentkezés + logisztika (`travel_mode`, `accommodation_cost/paid`, `entry_fee_amount/paid`)
- `membership_fees` – havi tagdíjak, `status` (`pending/paid/overdue/waived`), egyedi (student, year, month)

Pénzügyi táblák RLS-e a `finance.view` / `finance.manage` permission-höz kötött, hogy edzőknek egyedileg adható/elvehető legyen.

## Versenyzői profil (CRM) & GDPR

- `athlete_categories` – korosztályok (Mini, Junior, Senior…)
- `athlete_profiles` – orvosi engedély lejárati dátum (`medical_certificate_expiry` – flag/riasztás az app rétegben)
- `gdpr_consents` – `gdpr_data` és `photo_video` nyilatkozatok, `accepted`/`accepted_at`

## Wardrobe (Ruházat)

- `costumes` – ruhák törzsadatai, `stock_quantity`
- `user_costumes` – kikölcsönzés diákokhoz, `status` (`borrowed/returned/lost/damaged`)
- `choreography_costumes` – ruha ↔ koreográfia hozzárendelés

## Koreográfia & Rule Engine

- `choreographies` – koreó alapadatai (kategória, verseny, hossz)
- `elements` – tánc/torna elemek szótára (`element_type`, `difficulty` 1–5)
- `choreography_elements` – egy koreó elemeinek listája, sorrenddel
- `rules` – szabályok (`max_count`, `min/max_difficulty`, opcionális `category_id`/`element_type` szűrés)

### Validációs motor

`validate_choreography_rules(choreography_id uuid)` SQL függvény visszaadja a **megszegett** szabályokat: `rule_id`, `rule_code`, `rule_description`, `actual_count`, `max_count`. Az API réteg (Next.js Server Action / Route Handler) ezt hívja meg egy elem hozzáadása **előtt** (dry-run: ideiglenesen beszúrt elem + rollback, vagy előre validált limit-check), és hiba esetén pontosan visszaadja a megszegett szabály azonosítóját és leírását a kliensnek.

## RLS összegzés

| Terület | Olvasás | Írás |
|---|---|---|
| Publikus tartalom (hírek, órarend, versenyzők) | mindenki | `admin`, `coach` |
| Saját profil / gyerek profilja | saját + szülő + staff | saját + `admin` |
| Pénzügy (tagdíj, verseny logisztika) | saját + szülő + `finance.view` | `finance.manage` |
| Wardrobe | `wardrobe.view` | `wardrobe.manage` |
| Koreográfia/Rule Engine | `admin`, `coach` | `admin`, `coach` (elemek/szabályok: csak `admin`) |
| Audit log | csak `admin` | (csak trigger írja) |

---

**Következő lépés jóváhagyás után:** Next.js projekt scaffold (`/app`, `/components`, `/lib`), Supabase kliens/típusgenerálás, majd modulonkénti UI implementáció.
