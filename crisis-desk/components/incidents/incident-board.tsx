"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  ArrowDownUp,
  CheckCircle2,
  CircleAlert,
  Clock3,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";

import { INCIDENT_CATEGORIES, SEVERITY_CONFIG, STATUS_CONFIG } from "@/constants";
import { addIncidentActivity, subscribeToIncidents, subscribeToTeamMembers, updateIncident } from "@/lib/firebase";
import { useAuth } from "@/lib/firebase/auth-context";
import type { Incident, IncidentSeverity, IncidentStatus, UserProfile } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { CreateIncidentDialog } from "@/components/incidents/create-incident-dialog";

type FilterValue = "all" | IncidentSeverity | IncidentStatus | string;
type SortOrder = "newest" | "oldest" | "severity";

const severityOrder: Record<IncidentSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  const config = SEVERITY_CONFIG[severity];
  return <Badge variant="outline" className={config.badgeClass}>{config.label}</Badge>;
}

function StatusBadge({ status }: { status: IncidentStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant="outline" className={config.badgeClass}>{config.label}</Badge>;
}

function IncidentRow({ incident, canAssign, teamMembers, actor }: { incident: Incident; canAssign: boolean; teamMembers: UserProfile[]; actor: UserProfile | null }) {
  const [selectedAssignee, setSelectedAssignee] = useState(incident.assignedTo ?? "unassigned");
  const [saving, setSaving] = useState(false);

  const saveAssignment = async () => {
    if (!canAssign || !actor) return;
    const assignedTo = selectedAssignee === "unassigned" ? null : selectedAssignee;
    if (assignedTo === (incident.assignedTo ?? null)) return;
    setSaving(true);
    try {
      await updateIncident(incident.id, { assignedTo });
      await addIncidentActivity({
        incidentId: incident.id,
        eventId: incident.eventId,
        type: "assigned",
        message: assignedTo ? "Incident assignment updated." : "Incident assignment cleared.",
        actorId: actor.uid,
        metadata: { assignedTo },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="border-b border-border/60 last:border-0 hover:bg-muted/25">
      <td className="px-5 py-4 align-top">
        <div className="flex items-start gap-3">
          <span className={`mt-1 size-2 shrink-0 rounded-full ${SEVERITY_CONFIG[incident.severity].bgClass}`} />
          <div className="min-w-0">
            <Link href={`/incidents/${incident.id}`} className="font-medium leading-5 hover:text-red-700 hover:underline hover:underline-offset-4">{incident.title}</Link>
            <p className="mt-1 max-w-md truncate text-xs text-muted-foreground">{incident.description || "No description provided"}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 align-top"><SeverityBadge severity={incident.severity} /></td>
      <td className="px-4 py-4 align-top"><StatusBadge status={incident.status} /></td>
      <td className="px-4 py-4 align-top text-sm text-muted-foreground">{incident.category}</td>
      <td className="px-4 py-4 align-top text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{incident.location || "Not specified"}</span>
      </td>
      <td className="px-4 py-4 align-top">
        {canAssign ? <div className="flex min-w-52 gap-2"><Select value={selectedAssignee} onValueChange={(value) => setSelectedAssignee(value ?? "unassigned")} disabled={saving}><SelectTrigger className="h-8 min-w-0 flex-1"><SelectValue placeholder="Assign member" /></SelectTrigger><SelectContent><SelectItem value="unassigned">Unassigned</SelectItem>{teamMembers.map((member) => <SelectItem key={member.uid} value={member.uid}>{member.displayName}</SelectItem>)}</SelectContent></Select><Button size="sm" variant="outline" onClick={() => void saveAssignment()} disabled={saving || selectedAssignee === (incident.assignedTo ?? "unassigned")}>Assign</Button></div> : <span className="text-xs text-muted-foreground">{incident.assignedTo ? "Assigned" : "Unassigned"}</span>}
      </td>
      <td className="whitespace-nowrap px-5 py-4 align-top text-xs text-muted-foreground">
        {formatDistanceToNow(incident.createdAt, { addSuffix: true })}
      </td>
    </tr>
  );
}

export function IncidentBoard() {
  const { userProfile } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<FilterValue>("all");
  const [status, setStatus] = useState<FilterValue>("all");
  const [category, setCategory] = useState<FilterValue>("all");
  const [assignee, setAssignee] = useState<FilterValue>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const canAssign = Boolean(userProfile);
  const onlineTeamMembers = teamMembers.filter((member) => member.isOnline);

  useEffect(() => {
    if (!canAssign) return undefined;
    return subscribeToTeamMembers(setTeamMembers, () => undefined);
  }, [canAssign]);

  useEffect(() => {
    return subscribeToIncidents(
      (nextIncidents) => {
        setIncidents(nextIncidents);
        setLoading(false);
      },
      () => {
        setError("We couldn’t load the live incident board. Check your connection and try again.");
        setLoading(false);
      }
    );
  }, []);

  const normalizedSearch = search.trim().toLowerCase();
  const visibleIncidents = incidents
    .filter((incident) => {
      const matchesSearch = !normalizedSearch || [incident.title, incident.description, incident.category, incident.location ?? ""].some((value) => value.toLowerCase().includes(normalizedSearch));
      const matchesSeverity = severity === "all" || incident.severity === severity;
      const matchesStatus = status === "all" || incident.status === status;
      const matchesCategory = category === "all" || incident.category === category;
      const matchesAssignee = assignee === "all" || (assignee === "unassigned" ? !incident.assignedTo : incident.assignedTo === assignee);
      return matchesSearch && matchesSeverity && matchesStatus && matchesCategory && matchesAssignee;
    })
    .sort((first, second) => {
      if (sortOrder === "severity") return severityOrder[first.severity] - severityOrder[second.severity];
      const difference = first.createdAt.getTime() - second.createdAt.getTime();
      return sortOrder === "newest" ? -difference : difference;
    });

  const clearFilters = () => {
    setSearch("");
    setSeverity("all");
    setStatus("all");
    setCategory("all");
    setAssignee("all");
  };

  const assignees = Array.from(new Set(incidents.map((incident) => incident.assignedTo).filter((value): value is string => Boolean(value))));

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-red-700 dark:text-red-400">Live operations</p>
          <div className="flex items-center gap-3"><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Incident board</h2><span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"><span className="size-1.5 rounded-full bg-emerald-500" />Live</span></div>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">See what needs attention, who is responding, and where support is needed right now.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3"><div className="flex items-center gap-2 text-sm text-muted-foreground"><CircleAlert className="size-4" />{incidents.length} total {incidents.length === 1 ? "incident" : "incidents"}</div><CreateIncidentDialog /></div>
      </section>

      <section className="rounded-xl border border-border/80 bg-background p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search incidents..." aria-label="Search incidents" className="h-9 pl-9" /></div>
          <div className="flex flex-wrap items-center gap-2"><SlidersHorizontal className="hidden size-4 text-muted-foreground sm:block" />
            <Select value={severity} onValueChange={(value) => setSeverity(value ?? "all")}><SelectTrigger className="h-9 min-w-32"><SelectValue placeholder="Severity" /></SelectTrigger><SelectContent><SelectItem value="all">All severity</SelectItem>{Object.entries(SEVERITY_CONFIG).map(([value, config]) => <SelectItem key={value} value={value}>{config.label}</SelectItem>)}</SelectContent></Select>
            <Select value={status} onValueChange={(value) => setStatus(value ?? "all")}><SelectTrigger className="h-9 min-w-32"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All status</SelectItem>{Object.entries(STATUS_CONFIG).map(([value, config]) => <SelectItem key={value} value={value}>{config.label}</SelectItem>)}</SelectContent></Select>
            <Select value={category} onValueChange={(value) => setCategory(value ?? "all")}><SelectTrigger className="h-9 min-w-32"><SelectValue placeholder="Category" /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{INCIDENT_CATEGORIES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
            <Select value={assignee} onValueChange={(value) => setAssignee(value ?? "all")}><SelectTrigger className="h-9 min-w-32"><SelectValue placeholder="Assignee" /></SelectTrigger><SelectContent><SelectItem value="all">All assignees</SelectItem><SelectItem value="unassigned">Unassigned</SelectItem>{assignees.map((value) => <SelectItem key={value} value={value}>{value.slice(0, 12)}...</SelectItem>)}</SelectContent></Select>
            <Select value={sortOrder} onValueChange={(value) => setSortOrder((value ?? "newest") as SortOrder)}><SelectTrigger className="h-9 min-w-32"><ArrowDownUp className="mr-1 size-3.5 text-muted-foreground" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newest">Newest first</SelectItem><SelectItem value="oldest">Oldest first</SelectItem><SelectItem value="severity">By severity</SelectItem></SelectContent></Select>
          </div>
        </div>
      </section>

      {error ? <section className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 size-5 shrink-0 text-red-700 dark:text-red-300" /><div><h3 className="font-semibold text-red-900 dark:text-red-200">Incident board unavailable</h3><p className="mt-1 text-sm text-red-800/80 dark:text-red-200/80">{error}</p><Button variant="outline" size="sm" className="mt-4 border-red-300 bg-transparent text-red-800 hover:bg-red-100 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950" onClick={() => window.location.reload()}><RefreshCw className="size-3.5" />Try again</Button></div></div></section> : loading ? <section className="flex min-h-72 items-center justify-center rounded-xl border border-border/80 bg-background shadow-sm"><div className="flex flex-col items-center gap-3"><LoadingSpinner /><p className="text-sm text-muted-foreground">Connecting to the live incident board...</p></div></section> : visibleIncidents.length === 0 ? <section className="rounded-xl border border-border/80 bg-background shadow-sm"><EmptyState icon={search || severity !== "all" || status !== "all" || category !== "all" || assignee !== "all" ? Search : CheckCircle2} title={incidents.length === 0 ? "No incidents reported" : "No incidents match these filters"} description={incidents.length === 0 ? "When your team reports an issue, it will appear here for everyone to coordinate." : "Try adjusting your search or filters to see more incidents."} action={incidents.length > 0 ? <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button> : undefined} className="py-24" /></section> : <section className="overflow-hidden rounded-xl border border-border/80 bg-background shadow-sm"><div className="flex items-center justify-between border-b border-border/70 px-5 py-4 sm:px-6"><div><h3 className="font-semibold">All incidents</h3><p className="mt-1 text-xs text-muted-foreground">Updated automatically as your team responds.</p></div><span className="text-xs text-muted-foreground">{visibleIncidents.length} shown</span></div><div className="overflow-x-auto"><table className="w-full min-w-[1040px] text-left"><thead className="bg-muted/35 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"><tr><th className="px-5 py-3">Incident</th><th className="px-4 py-3">Severity</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Assignment</th><th className="px-5 py-3">Reported</th></tr></thead><tbody>{visibleIncidents.map((incident) => <IncidentRow key={incident.id} incident={incident} canAssign={canAssign} teamMembers={onlineTeamMembers} actor={userProfile} />)}</tbody></table></div></section>}

      {!loading && !error && visibleIncidents.length > 0 && <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><Clock3 className="size-3.5" />Sorted by {sortOrder === "severity" ? "severity" : sortOrder === "newest" ? "newest" : "oldest"}</span><span className="flex items-center gap-1.5"><UserRound className="size-3.5" />{onlineTeamMembers.length} mobile member{onlineTeamMembers.length === 1 ? "" : "s"} online</span></div>}
    </div>
  );
}