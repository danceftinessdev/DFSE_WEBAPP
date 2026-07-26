import { z } from "zod";

/**
 * Verseny (competitions) validáció.
 */
export const competitionSchema = z.object({
  name: z.string().min(2).max(200),
  location: z.string().max(200).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  description: z.string().max(2000).optional(),
});
export type CompetitionInput = z.infer<typeof competitionSchema>;

/**
 * Versenyre jelentkezés + logisztika/pénzügy (competition_participants) validáció.
 */
export const competitionParticipantSchema = z.object({
  competitionId: z.string().uuid(),
  studentId: z.string().uuid(),
  entryFeeAmount: z.number().nonnegative().default(0),
  entryFeePaid: z.boolean().default(false),
  travelMode: z.string().max(60).optional(),
  accommodationCost: z.number().nonnegative().default(0),
  accommodationPaid: z.boolean().default(false),
});
export type CompetitionParticipantInput = z.infer<typeof competitionParticipantSchema>;

/**
 * Havi tagdíj (membership_fees) validáció.
 */
export const membershipFeeSchema = z.object({
  studentId: z.string().uuid(),
  periodYear: z.number().int().min(2000).max(2100),
  periodMonth: z.number().int().min(1).max(12),
  amount: z.number().positive(),
  status: z.enum(["pending", "paid", "overdue", "waived"]).default("pending"),
});
export type MembershipFeeInput = z.infer<typeof membershipFeeSchema>;
