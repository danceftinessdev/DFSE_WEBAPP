import Calendar from "@/components/calendar/Calendar";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Órarend",
  description: "Az edzések, foglalkozások és események naptári nézete.",
  // other metadata
};
export default function page() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Órarend" />
      <Calendar />
    </div>
  );
}
