export default function AdminSchedulePage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Órarend &amp; Jelenléti ív</h1>
      <p className="text-muted-foreground">
        Óratípusok (`class_types`), naptárba rakott órák (`scheduled_classes`) és jelenléti ív
        (`attendance`) kezelése. CRUD felület fejlesztés alatt.
      </p>
    </div>
  );
}
