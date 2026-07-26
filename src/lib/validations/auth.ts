import { z } from "zod";

/**
 * Bejelentkezés form validáció.
 */
export const loginSchema = z.object({
  email: z.string().email({ message: "Érvénytelen e-mail cím." }),
  password: z.string().min(6, { message: "A jelszónak legalább 6 karakter hosszúnak kell lennie." }),
});
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Regisztráció form validáció.
 */
export const registerSchema = z
  .object({
    firstName: z.string().min(2, { message: "A keresztnév legalább 2 karakter." }),
    lastName: z.string().min(2, { message: "A vezetéknév legalább 2 karakter." }),
    email: z.string().email({ message: "Érvénytelen e-mail cím." }),
    password: z.string().min(6, { message: "A jelszónak legalább 6 karakter hosszúnak kell lennie." }),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "A jelszavak nem egyeznek.",
    path: ["passwordConfirm"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;
