"use client";

import { useActionState } from "react";

import { submitContactForm, type ContactFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ContactFormState = { success: false };

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContactForm, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Név</Label>
        <Input id="name" name="name" required minLength={2} maxLength={120} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="message">Üzenet</Label>
        <Textarea id="message" name="message" required minLength={10} maxLength={2000} rows={5} />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-emerald-600">Köszönjük az üzenetet, hamarosan válaszolunk!</p>
      )}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Küldés..." : "Üzenet küldése"}
      </Button>
    </form>
  );
}
