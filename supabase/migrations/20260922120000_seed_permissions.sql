-- Alap admin funkció-engedélyek a jogosultságkezelő számára.
-- Idempotens: újrafuttatáskor nem hoz létre duplikátumokat.
insert into public.permissions (code, description)
values
  ('dashboard.view', 'Vezérlőpult megtekintése'),
  ('members.view', 'Tagok megtekintése'),
  ('members.manage', 'Tagok létrehozása és módosítása'),
  ('payments.view', 'Befizetések megtekintése'),
  ('payments.manage', 'Befizetések módosítása'),
  ('schedule.view', 'Beosztás megtekintése'),
  ('schedule.manage', 'Beosztás és jelenlét kezelése'),
  ('competitions.manage', 'Versenyek kezelése'),
  ('news.manage', 'Hírek kezelése'),
  ('permissions.manage', 'Jogosultságok kezelése')
on conflict (code) do update set
  description = excluded.description;
