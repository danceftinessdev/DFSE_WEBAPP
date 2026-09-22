import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import React from "react";
import EditClassForm from "./EditClassForm";
import type { ClassFormInitial } from "../../ClassForm";

export const metadata: Metadata = {
  title: "Óra szerkesztése",
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ classId: string }>;
}

export default async function EditClassPage({ params }: Props) {
  const { classId } = await params;
  const supabase = await createClient();

  const { data: klass } = await supabase
    .from("training_classes")
    .select("*")
    .eq("id", classId)
    .maybeSingle();
  if (!klass) notFound();

  const [enrollmentsRes, membersRes, groupsRes] = await Promise.all([
    supabase.from("class_enrollments").select("member_id").eq("class_id", classId),
    supabase.from("members").select("id, full_name").neq("status", "inactive").order("full_name"),
    supabase.from("groups").select("id, name").eq("is_active", true).order("name"),
  ]);

  const initial: ClassFormInitial = {
    input: {
      name: klass.name,
      class_type: klass.class_type as "weekly" | "single",
      day_of_week: klass.day_of_week,
      specific_date: klass.specific_date,
      start_time: klass.start_time.slice(0, 5),
      end_time: klass.end_time.slice(0, 5),
      location: klass.location,
      coach_name: klass.coach_name,
      description: klass.description,
      group_id: klass.group_id,
    },
    memberIds: (enrollmentsRes.data ?? []).map((e) => e.member_id),
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Óra szerkesztése" />
      <EditClassForm
        classId={classId}
        initial={initial}
        members={membersRes.data ?? []}
        groups={groupsRes.data ?? []}
      />
    </div>
  );
}
