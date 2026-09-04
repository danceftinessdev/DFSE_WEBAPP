import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import BasicTableOne, { MemberRow } from "@/components/tables/BasicTableOne";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Tagok",
  description: "A Dance Fitness Sportegyesület tagjainak listája és adatai.",
};

export default async function BasicTables() {
  let mappedMembers: MemberRow[] | undefined;

  try {
    const supabase = await createClient();
    const { data: members, error } = await supabase
      .from("members")
      .select(`
        id,
        full_name,
        status,
        enrollments (
          fee_status,
          groups (
            name,
            monthly_fee
          )
        )
      `)
      .order("full_name");

    if (!error && members && members.length > 0) {
      const avatarImages = [
        "/images/user/user-17.jpg",
        "/images/user/user-18.jpg",
        "/images/user/user-20.jpg",
        "/images/user/user-21.jpg",
      ];

      mappedMembers = members.map((m, idx) => {
        const firstEnrollment = m.enrollments?.[0];
        const group = firstEnrollment?.groups;
        const statusLabel =
          m.status === "active"
            ? "Aktív"
            : m.status === "pending"
            ? "Függőben"
            : "Inaktív";
        const fee = group?.monthly_fee
          ? `${group.monthly_fee.toLocaleString("hu-HU")} Ft`
          : "12 000 Ft";

        return {
          id: m.id,
          user: {
            image: avatarImages[idx % avatarImages.length],
            name: m.full_name,
            role: group?.name ?? "Általános tag",
          },
          projectName: group?.name ?? "Zumba",
          team: {
            images: ["/images/user/user-22.jpg"],
          },
          status: statusLabel,
          budget: fee,
        };
      });
    }
  } catch {
    // If unauthenticated or offline, BasicTableOne falls back gracefully
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Tagok" />
      <div className="space-y-6">
        <ComponentCard title="Tagok listája">
          <BasicTableOne data={mappedMembers} />
        </ComponentCard>
      </div>
    </div>
  );
}

