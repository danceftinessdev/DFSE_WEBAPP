import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import BasicTableOne from "@/components/tables/BasicTableOne";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Tagok",
  description: "A Dance Fitness Sportegyesület tagjainak listája és adatai.",
  // other metadata
};

export default function BasicTables() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Tagok" />
      <div className="space-y-6">
        <ComponentCard title="Tagok listája">
          <BasicTableOne />
        </ComponentCard>
      </div>
    </div>
  );
}
