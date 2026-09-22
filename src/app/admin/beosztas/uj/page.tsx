import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import React from "react";
import NewClassForm from "./NewClassForm";

export const metadata: Metadata = {
  title: "Új óra",
  description: "Új edzésóra létrehozása.",
};

export const dynamic = "force-dynamic";

export default async function NewClassPage() {
  const supabase = await createClient();
  const [membersRes, groupsRes] = await Promise.all([
    supabase.from("members").select("id, full_name").neq("status", "inactive").order("full_name"),
    supabase.from("groups").select("id, name").eq("is_active", true).order("name"),
  ]);

  return (
    <div>
      <PageBreadcrumb pageTitle="Új óra" />
      <NewClassForm members={membersRes.data ?? []} groups={groupsRes.data ?? []} />
    </div>
  );
}
