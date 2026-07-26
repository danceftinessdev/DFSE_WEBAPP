import { ContactForm } from "./contact-form";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Kapcsolat</h1>
      <p className="mb-8 text-muted-foreground">
        Kérdésed van? Írj nekünk, és hamarosan válaszolunk!
      </p>
      <ContactForm />
    </div>
  );
}
