import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import React from "react";
import SessionManager from "./SessionManager";

export const metadata: Metadata = {
  title: "Alkalom kezelése",
  description: "Jelenléti ív, alkalom státusz és felülírások kezelése.",
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ classId: string; date: string }>;
}

export default async function SessionPage({ params }: Props) {
  const { classId, date } = await params;
  const supabase = await createClient();

  const { data: klass } = await supabase
    .from("training_classes")
    .select("*")
    .eq("id", classId)
    .maybeSingle();
  if (!klass) notFound();

  const [enrollmentsRes, sessionRes, attendanceRes, membersRes] = await Promise.all([
    supabase
      .from("class_enrollments")
      .select("member_id, members ( id, full_name )")
      .eq("class_id", classId),
    supabase
      .from("session_status")
      .select("*")
      .eq("class_id", classId)
      .eq("session_date", date)
      .maybeSingle(),
    supabase
      .from("class_attendance")
      .select("*")
      .eq("class_id", classId)
      .eq("session_date", date),
    supabase.from("members").select("id, full_name").neq("status", "inactive").order("full_name"),
  ]);

  const enrolled = (enrollmentsRes.data ?? [])
    .map((e) => {
      const m = Array.isArray(e.members) ? e.members[0] : e.members;
      return m ? { id: m.id, full_name: m.full_name } : null;
    })
    .filter((m): m is { id: string; full_name: string } => Boolean(m))
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "hu"));

  return (
    <div>
      <PageBreadcrumb pageTitle={`${klass.name} – ${date}`} />
      <SessionManager
        classId={classId}
        date={date}
        klass={{
          id: klass.id,
          name: klass.name,
          start_time: klass.start_time,
          end_time: klass.end_time,
          location: klass.location,
          coach_name: klass.coach_name,
        }}
        enrolled={enrolled}
        allMembers={membersRes.data ?? []}
        session={sessionRes.data ?? null}
        initialAttendance={(attendanceRes.data ?? []).map((a) => ({
          member_id: a.member_id,
          guest_name: a.guest_name,
          status: a.status as "present" | "absent" | "excused",
        }))}
      />
    </div>
  );
}
