-- A lapok megnyitásától külön kezelt műveleti jogosultságok.
insert into public.permissions (code, description)
values
  ('members.manage', 'Tagok adatainak és csoportbeosztásának módosítása'),
  ('payments.manage', 'Befizetések létrehozása és módosítása'),
  ('choreographies.manage', 'Koreográfiák kezelése'),
  ('calendar.view', 'Naptár megtekintése'),
  ('statistics.view', 'Statisztikák megtekintése'),
  ('ui.view', 'Felületi mintaoldalak megtekintése'),
  ('other-pages.view', 'Egyéb admin oldalak megtekintése'),
  ('profile.view', 'Profil megtekintése')
on conflict (code) do update set
  description = excluded.description;
