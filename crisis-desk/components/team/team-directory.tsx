"use client";

import { useEffect, useState } from "react";
import { BriefcaseBusiness, Mail, Phone, ShieldCheck, UserRound, Users } from "lucide-react";

import { USER_ROLES } from "@/constants";
import { subscribeToIncidents, subscribeToTeamMembers } from "@/lib/firebase";
import { useAuth } from "@/lib/firebase/auth-context";
import type { Incident, UserProfile } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2);
}

function TeamMemberCard({ member, workload }: { member: UserProfile; workload: number }) {
  return (
    <article className="rounded-xl border border-border/80 bg-background p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar size="lg" className="bg-red-100 dark:bg-red-950"><AvatarImage src={member.photoURL ?? undefined} alt="" /><AvatarFallback className="bg-red-100 font-semibold text-red-800 dark:bg-red-950 dark:text-red-200">{initials(member.displayName)}</AvatarFallback></Avatar>
        <div className="min-w-0 flex-1"><h3 className="truncate font-semibold">{member.displayName}</h3><p className="mt-0.5 truncate text-xs text-muted-foreground">{USER_ROLES[member.role]}</p></div>
        <span className="size-2 shrink-0 rounded-full bg-emerald-500" title="Active" />
      </div>
      <div className="mt-5 space-y-2.5 text-sm text-muted-foreground"><p className="flex items-center gap-2 truncate"><Mail className="size-3.5 shrink-0" />{member.email}</p>{member.department && <p className="flex items-center gap-2"><BriefcaseBusiness className="size-3.5 shrink-0" />{member.department}</p>}{member.phone && <p className="flex items-center gap-2"><Phone className="size-3.5 shrink-0" />{member.phone}</p>}</div>
      <div className="mt-5 flex items-center justify-between border-t border-border/70 pt-4"><span className="text-xs text-muted-foreground">Active workload</span><Badge variant={workload > 3 ? "destructive" : "secondary"}>{workload} {workload === 1 ? "incident" : "incidents"}</Badge></div>
    </article>
  );
}

export function TeamDirectory() {
  const { userProfile } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(userProfile?.role !== "staff");
  const [error, setError] = useState<string | null>(null);
  const isLead = userProfile?.role !== "staff";

  useEffect(() => {
    if (!isLead) return undefined;
    return subscribeToTeamMembers(setMembers, () => {
      setError("We couldn’t load the response team. Check your connection and try again.");
      setLoading(false);
    });
  }, [isLead]);

  useEffect(() => {
    return subscribeToIncidents((nextIncidents) => {
      setIncidents(nextIncidents);
      setLoading((current) => isLead ? (members.length === 0 ? current : false) : false);
    }, () => undefined);
  }, [isLead, members.length]);

  if (!userProfile) return null;
  const visibleMembers = isLead ? members : [userProfile];
  const activeIncidents = incidents.filter((incident) => incident.status !== "resolved" && incident.status !== "closed");
  const totalWorkload = activeIncidents.length;
  const unassigned = activeIncidents.filter((incident) => !incident.assignedTo).length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm font-medium text-red-700 dark:text-red-400">Response team</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">People behind the response.</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">See who is active and how work is distributed across the team.</p></div><div className="flex items-center gap-2 text-sm text-muted-foreground"><span className="size-2 rounded-full bg-emerald-500" />Live workload</div></section>
      <section className="grid gap-4 sm:grid-cols-3"><div className="rounded-xl border border-border/80 bg-background p-5 shadow-sm"><p className="text-sm text-muted-foreground">Active members</p><p className="mt-3 text-3xl font-semibold">{visibleMembers.length}</p><p className="mt-2 text-xs text-muted-foreground">Available response profiles</p></div><div className="rounded-xl border border-border/80 bg-background p-5 shadow-sm"><p className="text-sm text-muted-foreground">Active incidents</p><p className="mt-3 text-3xl font-semibold">{totalWorkload}</p><p className="mt-2 text-xs text-muted-foreground">Across the live workspace</p></div><div className="rounded-xl border border-border/80 bg-background p-5 shadow-sm"><p className="text-sm text-muted-foreground">Unassigned</p><p className="mt-3 text-3xl font-semibold text-amber-700 dark:text-amber-400">{unassigned}</p><p className="mt-2 text-xs text-muted-foreground">Need an owner</p></div></section>
      {error ? <section className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">{error}</section> : loading ? <section className="flex min-h-64 items-center justify-center rounded-xl border border-border/80 bg-background"><LoadingSpinner /></section> : visibleMembers.length === 0 ? <section className="rounded-xl border border-border/80 bg-background"><EmptyState icon={Users} title="No active team members" description="Active team profiles will appear here when they join the workspace." className="py-24" /></section> : <section><div className="mb-4 flex items-center gap-2"><ShieldCheck className="size-4 text-red-700 dark:text-red-400" /><h2 className="font-semibold">Active response team</h2></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleMembers.map((member) => <TeamMemberCard key={member.uid} member={member} workload={activeIncidents.filter((incident) => incident.assignedTo === member.uid).length} />)}</div></section>}
      {!isLead && <p className="flex items-center gap-2 text-xs text-muted-foreground"><UserRound className="size-3.5" />Staff members can view their own profile. Department leads and event leads can view the full team.</p>}
    </div>
  );
}