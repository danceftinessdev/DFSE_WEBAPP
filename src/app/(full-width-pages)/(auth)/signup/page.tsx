import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Regisztráció",
  description: "Hozz létre fiókot a DFSE adminisztrációs felületén.",
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}
