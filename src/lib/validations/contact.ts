import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, { message: "A név legalább 2 karakter." }).max(120),
  email: z.string().email({ message: "Érvénytelen e-mail cím." }),
  message: z.string().min(10, { message: "Az üzenet legalább 10 karakter." }).max(2000),
});
export type ContactInput = z.infer<typeof contactSchema>;
