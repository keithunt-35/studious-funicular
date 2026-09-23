import type { Metadata } from "next";
import { TeamDirectory } from "@/components/team/team-directory";

export const metadata: Metadata = { title: "Team" };

export default function TeamPage() {
  return <TeamDirectory />;
}