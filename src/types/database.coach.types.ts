import type { Database } from "./database.types";

/**
 * Kényelmi típus-aliasok az edzői dashboard tábláihoz.
 *
 * A `20260904150000_coach_dashboard.sql` migráció deployolása után a
 * `npm run db:types` újragenerálta a `database.types.ts`-t, így innentől
 * minden típus a generált sémából származik. Az `ExtendedDatabase` név
 * kompatibilitási okokból megmaradt (a Supabase kliens gyártók ezt használják).
 */

export type ExtendedDatabase = Database;

type Tables = Database["public"]["Tables"];

export type Competition = Tables["competitions"]["Row"];
export type Choreography = Tables["choreographies"]["Row"];
export type NewsPost = Tables["news_posts"]["Row"];
export type Member = Tables["members"]["Row"];
export type TrainingClass = Tables["training_classes"]["Row"];
export type ClassEnrollment = Tables["class_enrollments"]["Row"];
export type SessionStatusRow = Tables["session_status"]["Row"];
export type ClassAttendanceRow = Tables["class_attendance"]["Row"];
export type MemberPayment = Tables["member_payments"]["Row"];
export type CompetitionEntry = Tables["competition_entries"]["Row"];
export type CompetitionPayment = Tables["competition_payments"]["Row"];
export type TravelVehicle = Tables["travel_vehicles"]["Row"];
export type ChoreographyDancer = Tables["choreography_dancers"]["Row"];
export type ChoreographyPart = Tables["choreography_parts"]["Row"];
export type Group = Tables["groups"]["Row"];
export type Enrollment = Tables["enrollments"]["Row"];

/** Egy versenyen nevezett koreográfia táncosa a JSON mezőkben. */
export interface EntryDancer {
  id: string;
  name: string;
}

/** Egy versenyen nevezett koreográfia eleme (pontértékkel) a JSON mezőkben. */
export interface EntryElement {
  name: string;
  points: number;
}

/** Utas a járművek JSON utaslistájában. */
export interface VehiclePassenger {
  id: string;
  name: string;
}
