"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  MessageSquare,
  Send,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { SEVERITY_CONFIG, STATUS_CONFIG, USER_ROLES } from "@/constants";
import {
  addIncidentActivity,
  addIncidentComment,
  subscribeToIncident,
  subscribeToIncidentActivities,
  subscribeToIncidentComments,
  subscribeToTeamMembers,
  updateIncident,
} from "@/lib/firebase";
import { useAuth } from "@/lib/firebase/auth-context";
import type { Incident, IncidentActivity, IncidentComment, IncidentStatus, UserProfile } from "@/types";
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

interface IncidentDetailProps {
  incidentId: string;
}

function activityIcon(type: IncidentActivity["type"]) {
  if (type === "resolved") return <CheckCircle2 className="size-4 text-emerald-600" />;
  if (type === "commented") return <MessageSquare className="size-4 text-blue-600" />;
  return <Clock3 className="size-4 text-muted-foreground" />;
}

function statusLabel(status: IncidentStatus) {
  return STATUS_CONFIG[status].label;
}

export function IncidentDetail({ incidentId }: IncidentDetailProps) {
  const { userProfile } = useAuth();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [activities, setActivities] = useState<IncidentActivity[]>([]);
  const [comments, setComments] = useState<IncidentComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState("");
  const [assignee, setAssignee] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const isLead = userProfile?.role !== "staff";

  useEffect(() => {
    const unsubscribeIncident = subscribeToIncident(incidentId, (nextIncident) => {
      setIncident(nextIncident);
      setLoading(false);
      if (nextIncident) setAssignee(nextIncident.assignedTo ?? "unassigned");
    }, () => {
      setError("We couldn’t load this incident. Check your connection and try again.");
      setLoading(false);
    });
    const unsubscribeActivities = subscribeToIncidentActivities(incidentId, setActivities, () => undefined);
    const unsubscribeComments = subscribeToIncidentComments(incidentId, setComments, () => undefined);

    return () => {
      unsubscribeIncident();
      unsubscribeActivities();
      unsubscribeComments();
    };
  }, [incidentId]);

  useEffect(() => {
    if (!isLead) return undefined;
    return subscribeToTeamMembers(setTeamMembers, () => undefined);
  }, [isLead, userProfile]);

  const recordActivity = async (type: IncidentActivity["type"], message: string, metadata?: IncidentActivity["metadata"]) => {
    if (!userProfile || !incident) return;
    await addIncidentActivity({ incidentId: incident.id, eventId: incident.eventId, type, message, actorId: userProfile.uid, metadata });
  };

  const changeStatus = async (nextStatus: IncidentStatus) => {
    if (!incident || !userProfile || nextStatus === incident.status) return;
    setBusy(true);
    try {
      const isResolved = nextStatus === "resolved";
      await updateIncident(incident.id, { status: nextStatus, resolvedAt: isResolved ? new Date() : null, resolvedBy: isResolved ? userProfile.uid : null, resolutionNotes: isResolved ? resolutionNotes || null : null });
      await recordActivity(isResolved ? "resolved" : "status_changed", `Status changed from ${statusLabel(incident.status)} to ${statusLabel(nextStatus)}.`, { from: incident.status, to: nextStatus });
      toast.success(`Incident marked ${statusLabel(nextStatus).toLowerCase()}`);
    } catch {
      toast.error("Could not update the incident status.");
    } finally {
      setBusy(false);
    }
  };

  const saveAssignee = async () => {
    const selectedAssignee = assignee === "unassigned" ? "" : assignee;
    if (!incident || !userProfile || selectedAssignee === (incident.assignedTo ?? "")) return;
    setBusy(true);
    try {
      await updateIncident(incident.id, { assignedTo: selectedAssignee || null });
      await recordActivity("assigned", selectedAssignee ? "Incident assignment updated." : "Incident assignment cleared.", { assignedTo: selectedAssignee || null });
      toast.success(selectedAssignee ? "Incident assigned" : "Assignment cleared");
    } catch {
      toast.error("Could not update the assignment.");
    } finally {
      setBusy(false);
    }
  };

  const submitComment = async () => {
    if (!incident || !userProfile || !comment.trim()) return;
    setBusy(true);
    try {
      const body = comment.trim();
      await addIncidentComment({ incidentId: incident.id, eventId: incident.eventId, authorId: userProfile.uid, body });
      await recordActivity("commented", body);
      setComment("");
      toast.success("Comment added");
    } catch {
      toast.error("Could not add your comment.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="flex min-h-72 items-center justify-center"><LoadingSpinner /></div>;
  if (error || !incident) return <EmptyState icon={FileText} title="Incident unavailable" description={error ?? "This incident may have been removed."} action={<Link href="/incidents" className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted"><ArrowLeft className="size-4" />Back to incidents</Link>} className="rounded-xl border border-border/80 bg-background py-24" />;

  const severity = SEVERITY_CONFIG[incident.severity];
  const selectableMembers = isLead ? teamMembers : userProfile ? [userProfile] : [];

  return (
    <div className="space-y-6">
      <Link href="/incidents" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" />Back to incident board</Link>

      <section className="rounded-xl border border-border/80 bg-background shadow-sm">
        <div className="border-b border-border/70 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div className="flex items-start gap-3"><span className={`mt-2 size-3 shrink-0 rounded-full ${severity.bgClass}`} /><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{incident.title}</h1><Badge variant="outline" className={severity.badgeClass}>{severity.label}</Badge><Badge variant="outline" className={STATUS_CONFIG[incident.status].badgeClass}>{STATUS_CONFIG[incident.status].label}</Badge></div><p className="mt-2 text-sm text-muted-foreground">Reported {formatDistanceToNow(incident.createdAt, { addSuffix: true })} · {incident.category}</p></div></div>
            <div className="flex flex-wrap items-center gap-2"><Select value={incident.status} onValueChange={(value) => changeStatus(value as IncidentStatus)} disabled={busy}><SelectTrigger className="h-9 min-w-36"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUS_CONFIG).map(([value, config]) => <SelectItem key={value} value={value}>{config.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
        </div>
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_18rem]">
          <div className="space-y-5"><div><h2 className="mb-2 text-sm font-semibold">What happened</h2><p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{incident.description}</p></div>{incident.photoUrl && <a href={incident.photoUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-border"><Image src={incident.photoUrl} alt="Incident attachment" width={1200} height={640} unoptimized className="max-h-80 w-full object-cover" /></a>}<div className="flex flex-wrap gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-1.5"><MapPin className="size-4" />{incident.location || "Location not specified"}</span><span className="flex items-center gap-1.5"><Clock3 className="size-4" />Updated {formatDistanceToNow(incident.updatedAt, { addSuffix: true })}</span></div></div>
          <aside className="space-y-4 rounded-lg bg-muted/40 p-4"><div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assignment</p><div className="flex gap-2"><Select value={assignee} onValueChange={(value) => setAssignee(value ?? "unassigned")} disabled={busy}><SelectTrigger className="h-9 min-w-0 flex-1"><SelectValue placeholder="Choose a responder" /></SelectTrigger><SelectContent><SelectItem value="unassigned">Unassigned</SelectItem>{selectableMembers.map((member) => <SelectItem key={member.uid} value={member.uid}>{member.displayName} · {member.department ?? USER_ROLES[member.role]}</SelectItem>)}</SelectContent></Select><Button size="sm" onClick={saveAssignee} disabled={busy || (assignee === "unassigned" ? "" : assignee) === (incident.assignedTo ?? "")} aria-label="Save assignment">Save</Button></div><p className="mt-2 text-xs text-muted-foreground">Assignment updates appear in the activity timeline.</p></div><div className="border-t border-border/70 pt-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resolution notes</p><textarea value={resolutionNotes} onChange={(event) => setResolutionNotes(event.target.value)} rows={4} placeholder="Add notes before resolving..." disabled={busy || incident.status === "resolved"} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" /><p className="mt-2 text-xs text-muted-foreground">Choose Resolved above to close the response.</p></div></aside>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-xl border border-border/80 bg-background shadow-sm"><div className="border-b border-border/70 px-5 py-4"><h2 className="font-semibold">Activity timeline</h2><p className="mt-1 text-xs text-muted-foreground">Every change is recorded for the response team.</p></div>{activities.length === 0 ? <EmptyState icon={Clock3} title="No activity yet" description="Status changes and assignments will appear here." className="py-16" /> : <ol className="space-y-5 p-5">{activities.map((activity) => <li key={activity.id} className="flex gap-3"><div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">{activityIcon(activity.type)}</div><div className="min-w-0"><p className="text-sm leading-5">{activity.message}</p><p className="mt-1 text-xs text-muted-foreground">{format(activity.createdAt, "MMM d, yyyy 'at' h:mm a")} · {activity.actorId.slice(0, 10)}...</p></div></li>)}</ol>}</section>

        <section className="rounded-xl border border-border/80 bg-background shadow-sm"><div className="border-b border-border/70 px-5 py-4"><h2 className="font-semibold">Team comments</h2><p className="mt-1 text-xs text-muted-foreground">Keep the response context in one place.</p></div><div className="space-y-4 p-5">{comments.length === 0 ? <div className="py-8 text-center"><MessageSquare className="mx-auto size-7 text-muted-foreground/50" /><p className="mt-2 text-sm text-muted-foreground">No comments yet.</p></div> : <div className="max-h-72 space-y-4 overflow-y-auto">{comments.map((item) => <article key={item.id} className="rounded-lg bg-muted/45 p-3"><div className="flex items-center justify-between gap-3"><span className="flex items-center gap-1.5 text-xs font-medium"><UserRound className="size-3.5" />{item.authorId.slice(0, 10)}...</span><time className="text-[11px] text-muted-foreground">{formatDistanceToNow(item.createdAt, { addSuffix: true })}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{item.body}</p></article>)}</div>}<div className="flex gap-2 border-t border-border/70 pt-4"><Input value={comment} onChange={(event) => setComment(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submitComment(); } }} placeholder="Add a comment..." disabled={busy} aria-label="Add a comment" /><Button size="icon" onClick={submitComment} disabled={busy || !comment.trim()} aria-label="Send comment"><Send className="size-4" /></Button></div></div></section>
      </div>
    </div>
  );
}