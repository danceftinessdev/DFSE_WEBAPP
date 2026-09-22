import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import React from "react";
import NewChoreographyForm from "./NewChoreographyForm";

export const metadata: Metadata = {
  title: "Új koreográfia",
  description: "Új koreográfia létrehozása.",
};

export const dynamic = "force-dynamic";

export default async function NewChoreographyPage() {
  const supabase = await createClient();
  const { data: groups } = await supabase
    .from("groups")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <div>
      <PageBreadcrumb pageTitle="Új koreográfia" />
      <NewChoreographyForm groups={groups ?? []} />
    </div>
  );
}
