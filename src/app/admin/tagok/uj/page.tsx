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
  const { data: groups } = await supabase
    .from("groups")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <div>
      <PageBreadcrumb pageTitle="Új tag" />
      <NewMemberForm groups={groups ?? []} />
    </div>
  );
}
