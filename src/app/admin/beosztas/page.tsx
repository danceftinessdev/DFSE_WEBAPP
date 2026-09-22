import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { createClient } from "@/lib/supabase/server";
import { startOfWeekMonday, toDateInputValue, addDays } from "@/lib/utils/format";
import { Metadata } from "next";
import React from "react";
import ScheduleManager, { ScheduleClass, SessionOverride } from "./ScheduleManager";

export const metadata: Metadata = {
  title: "Beosztás",
  description: "Heti edzésbeosztás, órák kezelése és jelenléti ívek.",
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ het?: string }>;
}

export default async function SchedulePage({ searchParams }: Props) {
  const { het } = await searchParams;
  const parsed = het ? new Date(het) : new Date();
  const weekStart = startOfWeekMonday(Number.isNaN(parsed.getTime()) ? new Date() : parsed);
  const weekEnd = addDays(weekStart, 6);
  const weekStartStr = toDateInputValue(weekStart);
  const weekEndStr = toDateInputValue(weekEnd);

  const supabase = await createClient();

  const [classesRes, enrollmentsRes, sessionsRes] = await Promise.all([
    supabase
      .from("training_classes")
      .select("*")
      .eq("is_active", true)
      .order("start_time"),
    supabase.from("class_enrollments").select("class_id, member_id"),
    supabase
      .from("session_status")
      .select("*")
      .gte("session_date", weekStartStr)
      .lte("session_date", weekEndStr),
  ]);

  const enrollmentMap = new Map<string, string[]>();
  for (const e of enrollmentsRes.data ?? []) {
    const list = enrollmentMap.get(e.class_id) ?? [];
    list.push(e.member_id);
    enrollmentMap.set(e.class_id, list);
  }

  const classes: ScheduleClass[] = (classesRes.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    class_type: c.class_type as "weekly" | "single",
    day_of_week: c.day_of_week,
    specific_date: c.specific_date,
    start_time: c.start_time,
    end_time: c.end_time,
    location: c.location,
    coach_name: c.coach_name,
    description: c.description,
    group_id: c.group_id,
    memberIds: enrollmentMap.get(c.id) ?? [],
  }));

  const sessions: SessionOverride[] = (sessionsRes.data ?? []).map((s) => ({
    class_id: s.class_id,
    session_date: s.session_date,
    status: s.status as "held" | "cancelled",
    note: s.note,
    override_start_time: s.override_start_time,
    override_end_time: s.override_end_time,
    override_coach: s.override_coach,
    override_location: s.override_location,
  }));

  return (
    <div>
      <PageBreadcrumb pageTitle="Beosztás" />
      <ScheduleManager
        classes={classes}
        sessions={sessions}
        weekStart={weekStartStr}
      />
    </div>
  );
}
