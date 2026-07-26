import { z } from "zod";

/**
 * Hír (news_posts) létrehozás/szerkesztés validáció.
 * A `content` mező a TipTap szerkesztő JSON kimenete.
 */
export const newsPostSchema = z.object({
  title: z.string().min(3, { message: "A cím legalább 3 karakter." }).max(200),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "A slug csak kisbetűket, számokat és kötőjeleket tartalmazhat.",
    }),
  excerpt: z.string().max(500).optional(),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  content: z.unknown(),
  isPublished: z.boolean().default(false),
});
export type NewsPostInput = z.infer<typeof newsPostSchema>;
