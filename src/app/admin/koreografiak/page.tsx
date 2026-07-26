export default function AdminChoreographiesPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Koreográfia Tervező &amp; Szabályrendszer</h1>
      <p className="text-muted-foreground">
        Koreográfiák (`choreographies`), elemek szótára (`elements`) és versenyszabályzatok
        (`rules`) kezelése, validációs motorral (`validate_choreography_rules`). CRUD felület
        fejlesztés alatt.
      </p>
    </div>
  );
}
