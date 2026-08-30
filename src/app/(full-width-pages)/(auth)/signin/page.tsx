import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bejelentkezés",
  description: "Jelentkezz be a DFSE adminisztrációs felületére.",
};

export default function SignIn() {
  return <SignInForm />;
}
