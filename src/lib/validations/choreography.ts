import { z } from "zod";

/**
 * Koreográfia (choreographies) validáció.
 */
export const choreographySchema = z.object({
  name: z.string().min(2).max(200),
  categoryId: z.string().uuid().optional(),
  competitionId: z.string().uuid().optional(),
  durationSeconds: z.number().int().positive().optional(),
});
export type ChoreographyInput = z.infer<typeof choreographySchema>;

/**
 * Elem (elements) hozzáadása egy koreográfiához.
 */
export const choreographyElementSchema = z.object({
  choreographyId: z.string().uuid(),
  elementId: z.string().uuid(),
  sequenceOrder: z.number().int().nonnegative().default(0),
});
export type ChoreographyElementInput = z.infer<typeof choreographyElementSchema>;

/**
 * Szabály (rules) validáció.
 */
export const ruleSchema = z.object({
  code: z.string().min(2).max(100),
  description: z.string().min(2).max(1000),
  categoryId: z.string().uuid().optional(),
  elementType: z.string().max(60).optional(),
  maxCount: z.number().int().nonnegative().optional(),
  minDifficulty: z.number().int().min(1).max(5).optional(),
  maxDifficulty: z.number().int().min(1).max(5).optional(),
});
export type RuleInput = z.infer<typeof ruleSchema>;
