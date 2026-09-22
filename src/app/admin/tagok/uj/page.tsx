import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import React from "react";
import NewMemberForm from "./NewMemberForm";

export const metadata: Metadata = {
  title: "Új tag",
  description: "Új tag felvétele.",
};

export const dynamic = "force-dynamic";

export default async function NewMemberPage() {
  const supabase = await createClient();
  const [{ data: groups }, { data: profiles }] = await Promise.all([
    supabase.from("groups").select("id, name").eq("is_active", true).order("name"),
    supabase.from("profiles").select("id, display_name, email").eq("is_active", true).order("email"),
  ]);

  return (
    <div>
      <PageBreadcrumb pageTitle="Új tag" />
      <NewMemberForm groups={groups ?? []} profiles={profiles ?? []} />
    </div>
  );
}
