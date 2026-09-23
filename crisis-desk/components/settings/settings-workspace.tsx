"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Plus, Save, Settings2, ShieldCheck, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { USER_ROLES } from "@/constants";
import {
  getEvent,
  getNotificationPreferences,
  saveEventDocument,
  subscribeToTeamMembers,
  updateNotificationPreferences,
  updateEvent,
  updateUserProfile,
} from "@/lib/firebase";
import { useAuth } from "@/lib/firebase/auth-context";
import type { EventDocument, NotificationPreferences, UserProfile, UserRole } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

const defaultEventId = process.env.NEXT_PUBLIC_DEFAULT_EVENT_ID ?? "default-event";
const fallbackCategories = ["AV / Technical", "Catering / Food", "Speaker / Presenter", "VIP / Guest", "Security", "Venue / Facilities", "Medical", "Logistics", "Staff", "Other"];

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2);
}

export function SettingsWorkspace() {
  const { userProfile } = useAuth();
  const isEventLead = userProfile?.role === "event_lead";
  const [event, setEvent] = useState<EventDocument | null>(null);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [eventName, setEventName] = useState("");
  const [venue, setVenue] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [categories, setCategories] = useState<string[]>(fallbackCategories);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingEvent, setSavingEvent] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userProfile) return;
    let active = true;
    Promise.all([getEvent(defaultEventId), getNotificationPreferences(userProfile.uid)])
      .then(([loadedEvent, loadedPreferences]) => {
        if (!active) return;
        setEvent(loadedEvent);
        setPreferences(loadedPreferences);
        if (loadedEvent) {
          setEventName(loadedEvent.name);
          setVenue(loadedEvent.venue ?? "");
          setTimezone(loadedEvent.timezone);
          setCategories(loadedEvent.categories?.length ? loadedEvent.categories : fallbackCategories);
        }
      })
      .catch(() => {
        if (active) setError("Settings could not be loaded. Check your Firebase connection.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [userProfile]);

  useEffect(() => {
    if (!isEventLead) return undefined;
    return subscribeToTeamMembers(setMembers, () => setError("Team role management is unavailable right now."));
  }, [isEventLead]);

  if (!userProfile || loading) return <div className="flex min-h-72 items-center justify-center"><LoadingSpinner /></div>;

  const saveEventSettings = async () => {
    if (!isEventLead || !eventName.trim()) return;
    setSavingEvent(true);
    try {
      if (event) await updateEvent(event.id, { name: eventName.trim(), venue: venue.trim() || undefined, timezone, categories });
      else await saveEventDocument(defaultEventId, { name: eventName.trim(), venue: venue.trim() || undefined, timezone, categories, createdBy: userProfile.uid });
      setEvent((current) => current ?? { id: defaultEventId, name: eventName.trim(), venue: venue.trim() || undefined, timezone, categories, isActive: true, createdBy: userProfile.uid, createdAt: new Date(), updatedAt: new Date() });
      toast.success("Event settings saved");
    } catch {
      toast.error("Could not save event settings.");
    } finally {
      setSavingEvent(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;
    setSavingPreferences(true);
    try {
      await updateNotificationPreferences(userProfile.uid, {
        email: preferences.email,
        sms: preferences.sms,
        push: preferences.push,
        criticalOnly: preferences.criticalOnly,
      });
      toast.success("Notification preferences saved");
    } catch {
      toast.error("Could not save notification preferences.");
    } finally {
      setSavingPreferences(false);
    }
  };

  const addCategory = () => {
    const value = newCategory.trim();
    if (!value || categories.some((category) => category.toLowerCase() === value.toLowerCase())) return;
    setCategories((current) => [...current, value]);
    setNewCategory("");
  };

  const changeRole = async (uid: string, role: UserRole) => {
    try {
      await updateUserProfile(uid, { role });
      toast.success("Team role updated");
    } catch {
      toast.error("Could not update that role.");
    }
  };

  return (
    <div className="space-y-8">
      <section><p className="mb-2 text-sm font-medium text-red-700 dark:text-red-400">Workspace controls</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Settings</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">Keep your event details, alerts, categories, and access roles ready for the team.</p></section>
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">{error}</div>}

      <section className="rounded-xl border border-border/80 bg-background shadow-sm"><div className="border-b border-border/70 p-5 sm:p-6"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-lg bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"><Settings2 className="size-5" /></div><div><h2 className="font-semibold">Event configuration</h2><p className="mt-1 text-xs text-muted-foreground">The shared context for your command center.</p></div></div></div><div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6"><div className="space-y-1.5"><Label htmlFor="event-name">Event name</Label><Input id="event-name" value={eventName} onChange={(event) => setEventName(event.target.value)} placeholder="e.g. Africa Tech Summit" disabled={!isEventLead} /></div><div className="space-y-1.5"><Label htmlFor="event-venue">Venue</Label><Input id="event-venue" value={venue} onChange={(event) => setVenue(event.target.value)} placeholder="e.g. Cape Town Convention Centre" disabled={!isEventLead} /></div><div className="space-y-1.5"><Label>Timezone</Label><Select value={timezone} onValueChange={(value) => setTimezone(value ?? "UTC")} disabled={!isEventLead}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="UTC">UTC</SelectItem><SelectItem value="Africa/Nairobi">Africa/Nairobi</SelectItem><SelectItem value="Africa/Johannesburg">Africa/Johannesburg</SelectItem><SelectItem value="Africa/Lagos">Africa/Lagos</SelectItem><SelectItem value="Africa/Accra">Africa/Accra</SelectItem></SelectContent></Select></div><div className="flex items-end"><Button onClick={saveEventSettings} disabled={!isEventLead || savingEvent || !eventName.trim()} className="gap-2 bg-red-700 text-white hover:bg-red-800"><Save className="size-4" />{savingEvent ? "Saving..." : "Save event"}</Button></div></div>{!isEventLead && <p className="border-t border-border/70 px-5 py-3 text-xs text-muted-foreground sm:px-6">Only event leads can change shared event settings.</p>}</section>

      <section className="rounded-xl border border-border/80 bg-background shadow-sm"><div className="border-b border-border/70 p-5 sm:p-6"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"><Bell className="size-5" /></div><div><h2 className="font-semibold">Notification preferences</h2><p className="mt-1 text-xs text-muted-foreground">Prepare email, SMS, and future Africa&apos;s Talking notifications.</p></div></div></div>{preferences && <div className="space-y-3 p-5 sm:p-6">{([['email', 'Email alerts', 'Receive updates in your inbox'], ['sms', 'SMS alerts', 'Ready for Africa\'s Talking integration'], ['push', 'Push notifications', 'Receive browser notifications'], ['criticalOnly', 'Critical incidents only', 'Reduce notifications to the highest severity']] as const).map(([key, label, description]) => <label key={key} className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border/70 p-3 hover:bg-muted/30"><span><span className="block text-sm font-medium">{label}</span><span className="mt-1 block text-xs text-muted-foreground">{description}</span></span><input type="checkbox" checked={preferences[key]} onChange={(event) => setPreferences({ ...preferences, [key]: event.target.checked })} className="size-4 accent-red-700" /></label>)}<Button onClick={savePreferences} disabled={savingPreferences} variant="outline" className="mt-2 gap-2"><Check className="size-4" />{savingPreferences ? "Saving..." : "Save preferences"}</Button></div>}</section>

      <section className="rounded-xl border border-border/80 bg-background shadow-sm"><div className="border-b border-border/70 p-5 sm:p-6"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"><Plus className="size-5" /></div><div><h2 className="font-semibold">Incident categories</h2><p className="mt-1 text-xs text-muted-foreground">Keep issue labels useful for your event team.</p></div></div></div><div className="p-5 sm:p-6"><div className="flex flex-wrap gap-2">{categories.map((category) => <Badge key={category} variant="outline" className="gap-1.5 py-1">{category}{isEventLead && <button type="button" onClick={() => setCategories((current) => current.filter((item) => item !== category))} className="text-muted-foreground hover:text-destructive" aria-label={`Remove ${category}`}><Trash2 className="size-3" /></button>}</Badge>)}</div>{isEventLead && <div className="mt-5 flex max-w-md gap-2"><Input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCategory(); } }} placeholder="Add a category" /><Button variant="outline" onClick={addCategory} aria-label="Add category"><Plus className="size-4" /></Button></div>}<p className="mt-4 text-xs text-muted-foreground">Category changes are saved with the event configuration.</p></div></section>

      {isEventLead && <section className="rounded-xl border border-border/80 bg-background shadow-sm"><div className="border-b border-border/70 p-5 sm:p-6"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><Users className="size-5" /></div><div><h2 className="font-semibold">User roles</h2><p className="mt-1 text-xs text-muted-foreground">Give each team member the access level they need.</p></div></div></div><div className="divide-y divide-border/70">{members.map((member) => <div key={member.uid} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="flex items-center gap-3"><Avatar size="sm"><AvatarImage src={member.photoURL ?? undefined} alt="" /><AvatarFallback>{initials(member.displayName)}</AvatarFallback></Avatar><div><p className="text-sm font-medium">{member.displayName}</p><p className="text-xs text-muted-foreground">{member.email}</p></div></div><Select value={member.role} onValueChange={(value) => changeRole(member.uid, value as UserRole)} disabled={member.uid === userProfile.uid}><SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(USER_ROLES).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>)}</div></section>}

      {!isEventLead && <p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-3.5" />Your account can manage personal notification preferences. Event settings and role management require an event lead.</p>}
    </div>
  );
}