"use client";

import Link from "next/link";
import { useActionState } from "react";

import { registerAction, type AuthFormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthFormState = {};

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Regisztráció</CardTitle>
        <CardDescription>Hozd létre a fiókodat a csatlakozáshoz.</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">Keresztnév</Label>
              <Input id="firstName" name="firstName" required autoComplete="given-name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Vezetéknév</Label>
              <Input id="lastName" name="lastName" required autoComplete="family-name" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Jelszó</Label>
            <Input id="password" name="password" type="password" required autoComplete="new-password" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="passwordConfirm">Jelszó megerősítése</Label>
            <Input id="passwordConfirm" name="passwordConfirm" type="password" required autoComplete="new-password" />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Regisztráció..." : "Regisztráció"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Van már fiókod?{" "}
            <Link href="/login" className="font-medium text-foreground underline">
              Bejelentkezés
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
