import LineChartOne from "@/components/charts/line/LineChartOne";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Vonaldiagram",
  description: "Statisztikai vonaldiagram nézet a foglalkozásokról és létszámadatokról.",
};
export default function LineChart() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Vonaldiagram" />
      <div className="space-y-6">
        <ComponentCard title="Vonaldiagram">
          <LineChartOne />
        </ComponentCard>
      </div>
    </div>
  );
}
