import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";
import NewCompetitionForm from "./NewCompetitionForm";

export const metadata: Metadata = {
  title: "Új verseny",
  description: "Új verseny létrehozása.",
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ datum?: string }>;
}

export default async function NewCompetitionPage({ searchParams }: Props) {
  const { datum } = await searchParams;

  return (
    <div>
      <PageBreadcrumb pageTitle="Új verseny" />
      <NewCompetitionForm defaultDate={datum ?? null} />
    </div>
  );
}
