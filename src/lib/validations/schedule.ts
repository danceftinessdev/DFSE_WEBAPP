import { z } from "zod";

/**
 * Óratípus (class_types) validáció.
 */
export const classTypeSchema = z.object({
  name: z.string().min(2, { message: "A név legalább 2 karakter." }).max(120),
  description: z.string().max(1000).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, { message: "Érvénytelen szín (pl. #6366f1)." }),
  level: z.string().max(60).optional(),
});
export type ClassTypeInput = z.infer<typeof classTypeSchema>;

/**
 * Konkrét, naptárba rakott óra (scheduled_classes) validáció.
 */
export const scheduledClassSchema = z
  .object({
    classTypeId: z.string().uuid({ message: "Válassz óratípust." }),
    coachId: z.string().uuid().optional(),
    location: z.string().max(200).optional(),
    startsAt: z.string().datetime({ message: "Érvénytelen kezdés időpont." }),
    endsAt: z.string().datetime({ message: "Érvénytelen befejezés időpont." }),
    capacity: z.number().int().positive().optional(),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: "A befejezésnek a kezdés után kell lennie.",
    path: ["endsAt"],
  });
export type ScheduledClassInput = z.infer<typeof scheduledClassSchema>;

/**
 * Jelenlét (attendance) rögzítés validáció.
 */
export const attendanceSchema = z.object({
  scheduledClassId: z.string().uuid(),
  studentId: z.string().uuid(),
  status: z.enum(["present", "absent", "excused", "late"]),
  note: z.string().max(500).optional(),
});
export type AttendanceInput = z.infer<typeof attendanceSchema>;
