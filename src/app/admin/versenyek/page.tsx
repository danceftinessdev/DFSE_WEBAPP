import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import React from "react";
import CompetitionManager from "./CompetitionManager";
import type { Competition } from "@/types/database.coach.types";

export const metadata: Metadata = {
  title: "Versenyek",
  description: "Versenyek kezelése, nevezések, utazás és fizetések.",
};

export const dynamic = "force-dynamic";

export default async function CompetitionsPage() {
  const supabase = await createClient();
  const { data: competitions } = await supabase
    .from("competitions")
    .select("*")
    .eq("is_active", true)
    .order("starts_at");

  return (
    <div>
      <PageBreadcrumb pageTitle="Versenyek" />
      <CompetitionManager competitions={(competitions ?? []) as Competition[]} />
    </div>
  );
}
