import BarChartOne from "@/components/charts/bar/BarChartOne";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Oszlopdiagram",
  description: "Statisztikai oszlopdiagram nézet a foglalkozásokról és létszámadatokról.",
};

export default function page() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Oszlopdiagram" />
      <div className="space-y-6">
        <ComponentCard title="Oszlopdiagram">
          <BarChartOne />
        </ComponentCard>
      </div>
    </div>
  );
}
